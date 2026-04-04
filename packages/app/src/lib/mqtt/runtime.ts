import { Aedes } from 'aedes'
import { connect, MqttClient } from 'mqtt'
import * as $ from 'drizzle-orm'

import { db, schema } from '@/lib/db'
import { renderTopicTemplate, toStateRecord } from '@/lib/device-templates/protocol'
import { createLogger } from '@/lib/logger'
import { isDeepStrictEqual } from 'node:util'

const log = createLogger('mqtt-runtime')

interface ExpectedPayloadMatch {
  path: string
  value: unknown
}

interface MqttResponse {
  topic: string
  payload: Record<string, unknown>
}

interface PublishRequestAndWaitForResponseInput {
  commandId: number
  messageId: string
  deviceId: number
  requestTopic: string
  responseTopic?: string
  responseMessageId?: string
  expectedPayloadMatches?: ExpectedPayloadMatch[]
  payload: unknown
  timeoutMs: number
}

interface PendingRequest {
  commandId: number
  deviceId: number
  expectedTopic: string
  expectedPayloadMatches?: ExpectedPayloadMatch[]
  responseMessageId?: string
  temporarySubscription?: boolean
  resolve: (result: MqttResponse) => void
  reject: (error: Error) => void
  timer: NodeJS.Timeout
}

class MqttRuntime {
  private isPrimaryIngestor = true
  private roleElectionTimer: NodeJS.Timeout | null = null
  private broker: Aedes | null = null
  private client: MqttClient | null = null
  private pendingRequests = new Map<number, PendingRequest>()
  private recentOutgoing = new Map<string, number>()

  private serializePayload(payload: unknown) {
    try {
      return JSON.stringify(payload)
    }
    catch {
      return String(payload)
    }
  }

  private buildMessageFingerprint(topic: string, payload: unknown) {
    return `${topic}|${this.serializePayload(payload)}`
  }

  private rememberOutgoingMessage(topic: string, payload: unknown) {
    const now = Date.now()
    const fingerprint = this.buildMessageFingerprint(topic, payload)
    this.recentOutgoing.set(fingerprint, now)

    if (this.recentOutgoing.size > 500) {
      const cutoff = now - 10000
      for (const [key, ts] of this.recentOutgoing.entries()) {
        if (ts < cutoff) {
          this.recentOutgoing.delete(key)
        }
      }
    }
  }

  private isSelfEchoMessage(topic: string, payload: unknown) {
    const fingerprint = this.buildMessageFingerprint(topic, payload)
    const ts = this.recentOutgoing.get(fingerprint)
    if (!ts) {
      return false
    }

    if (Date.now() - ts <= 3000) {
      this.recentOutgoing.delete(fingerprint)
      return true
    }

    this.recentOutgoing.delete(fingerprint)
    return false
  }

  private async setupIngestRole() {
    try {
      await this.tryAcquirePrimaryRole()

      if (!this.isPrimaryIngestor) {
        this.startRoleElectionLoop()
      }
    }
    catch (error) {
      // Safety-first: on role check failure, do not ingest to prevent duplicate writes.
      this.isPrimaryIngestor = false
      log.warn({ error }, 'failed to determine mqtt ingestor role, fallback to secondary mode')
      this.startRoleElectionLoop()
    }
  }

  private async tryAcquirePrimaryRole() {
    const { Client } = await import('pg')
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
      throw new Error('DATABASE_URL is not set')
    }

    const roleClient = new Client({ connectionString })
    await roleClient.connect()

    const result = await roleClient.query<{ locked: boolean }>('select pg_try_advisory_lock($1) as locked', [82531883])
    const locked = Boolean(result.rows[0]?.locked)

    if (locked) {
      this.isPrimaryIngestor = true
      this.stopRoleElectionLoop()

      roleClient.on('error', (error) => {
        this.handleRoleLockConnectionLoss(error)
      })

      log.info('acquired mqtt primary ingestor role')
      return
    }

    await roleClient.end()
    this.isPrimaryIngestor = false
  }

  private handleRoleLockConnectionLoss(error: unknown) {
    if (!this.isPrimaryIngestor) {
      return
    }

    this.isPrimaryIngestor = false
    log.warn({ error }, 'lost mqtt primary ingestor lock, switched to secondary')

    if (this.client?.connected) {
      void this.unsubscribeTopicSafely('device/+/+/#', 'role demotion')
    }

    this.startRoleElectionLoop()
  }

  private startRoleElectionLoop() {
    if (this.roleElectionTimer) return

    this.roleElectionTimer = setInterval(async () => {
      if (this.isPrimaryIngestor) return

      try {
        await this.tryAcquirePrimaryRole()

        if (this.isPrimaryIngestor && this.client?.connected) {
          await this.client.subscribeAsync('device/+/+/#')
          log.info({ topic: 'device/+/+/#' }, 'subscribed to device topics after promotion to primary')
        }
      }
      catch (error) {
        log.debug({ error }, 'mqtt role election retry failed')
      }
    }, 5000)
  }

  private stopRoleElectionLoop() {
    if (!this.roleElectionTimer) return

    clearInterval(this.roleElectionTimer)
    this.roleElectionTimer = null
  }

  private async unsubscribeTopicSafely(topic: string, reason: string) {
    try {
      await this.client?.unsubscribeAsync(topic)
    }
    catch (error) {
      log.warn({ error, topic, reason }, 'failed to unsubscribe mqtt topic')
    }
  }

  private async startEmbeddedBroker(port: number) {
    try {
      const net = await import('node:net')
      const { Aedes } = await import('aedes')
      this.broker = await Aedes.createBroker()
      const server = net.createServer(this.broker.handle)

      await new Promise<void>((resolve, reject) => {
        const onError = (error: NodeJS.ErrnoException) => {
          // If the port is already in use, we assume it's our broker from a previous instance and connect to it
          if (error.code === 'EADDRINUSE') {
            log.warn({ port }, 'mqtt broker port already in use, will connect to existing broker')
            this.broker = null
            resolve()
          }
          else {
            reject(error)
          }
        }

        server.once('error', onError)
        server.listen(port, '0.0.0.0', () => {
          server.removeListener('error', onError)
          log.info({ port }, 'embedded mqtt broker started')
          resolve()
        })
      })
    }
    catch (error) {
      log.error({ error, port }, 'failed to start embedded mqtt broker, will attempt to connect to existing broker')
      this.broker = null
    }
  }

  startPromise: Promise<void> | null = null

  async start() {
    if (this.startPromise) return this.startPromise

    const startTask = Promise.withResolvers<void>()
    this.startPromise = startTask.promise

    const shouldStartEmbeddedBroker = process.env.MQTT_EMBEDDED_BROKER !== 'false'
    const mqttUrl = process.env.MQTT_URL || 'mqtt://127.0.0.1:1883'
    const port = Number(process.env.MQTT_PORT || 1883)

    log.info({ mqttUrl, shouldStartEmbeddedBroker, port }, 'initializing mqtt runtime')

    await this.setupIngestRole()

    if (shouldStartEmbeddedBroker) {
      await this.startEmbeddedBroker(port)
    }

    this.client = connect(mqttUrl)

    this.client.on('connect', async () => {
      log.info({ mqttUrl }, 'mqtt client connected')

      if (this.isPrimaryIngestor) {
        try {
          await this.client?.subscribeAsync('device/+/+/#')
          log.info({ topic: 'device/+/+/#' }, 'subscribed to device topics')
        }
        catch (subscribeError) {
          log.error({ error: subscribeError, topic: 'device/+/+/#' }, 'failed to subscribe to device topics')
        }
      }
      else {
        log.info('secondary instance connected without wildcard topic subscription')
      }
    })

    this.client.on('reconnect', () => {
      log.warn('mqtt client reconnecting')
    })

    this.client.on('close', () => {
      log.warn('mqtt client connection closed')
    })

    this.client.on('offline', () => {
      log.warn('mqtt client offline')
    })

    this.client.on('error', (error) => {
      log.error({ error }, 'mqtt client error')
    })

    this.client.on('message', async (topic, payload) => {
      await this.handleIncomingMessage(topic, payload)
    })

    startTask.resolve()

    log.info('mqtt runtime started')
  }

  async publishRequestAndWaitForResponse(input: PublishRequestAndWaitForResponseInput) {
    await this.start()

    if (!this.client) {
      throw new Error('MQTT client is not ready')
    }

    await this.saveOutgoingMessage(input.deviceId, input.requestTopic, input.payload, input.messageId)
    if (!input.responseTopic) {
      log.info(
        {
          commandId: input.commandId,
          deviceId: input.deviceId,
          requestTopic: input.requestTopic,
          responseTopic: input.responseTopic,
        },
        'publishing mqtt request command'
      )

      await this.client?.publishAsync(input.requestTopic, JSON.stringify(input.payload))

      return {
        topic: input.requestTopic,
        payload: {},
      }
    }

    const responseTopic = input.responseTopic
    const useTemporarySubscription = !this.isPrimaryIngestor

    if (useTemporarySubscription) {
      await this.client?.subscribeAsync(responseTopic)

      log.debug({ responseTopic }, 'subscribed temporary response topic on secondary instance')
    }

    const responsePromise = new Promise<MqttResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(input.commandId)

        if (useTemporarySubscription) {
          void this.unsubscribeTopicSafely(responseTopic, 'request timeout cleanup')
        }

        log.warn({ commandId: input.commandId }, 'mqtt request timed out waiting for response')
        reject(new Error('Command response timed out'))
      }, input.timeoutMs)

      this.pendingRequests.set(input.commandId, {
        commandId: input.commandId,
        deviceId: input.deviceId,
        expectedTopic: responseTopic,
        expectedPayloadMatches: input.expectedPayloadMatches,
        responseMessageId: input.responseMessageId,
        temporarySubscription: useTemporarySubscription,
        resolve,
        reject,
        timer,
      })

      log.debug({ commandId: input.commandId, responseTopic }, 'registered pending mqtt response waiter')
    })

    log.info(
      {
        commandId: input.commandId,
        deviceId: input.deviceId,
        requestTopic: input.requestTopic,
        responseTopic: input.responseTopic,
      },
      'publishing mqtt request command'
    )

    try {
      await this.client?.publishAsync(input.requestTopic, JSON.stringify(input.payload))
    }
    catch (error) {
      const pending = this.pendingRequests.get(input.commandId)
      if (pending) {
        clearTimeout(pending.timer)
        this.pendingRequests.delete(input.commandId)
      }

      if (useTemporarySubscription) {
        void this.unsubscribeTopicSafely(responseTopic, 'publish failure cleanup')
      }

      throw error
    }

    return await responsePromise
  }

  private async handleIncomingMessage(topic: string, payloadBuffer: Buffer) {
    const payload = this.parsePayload(payloadBuffer)
    log.debug({ topic, payload }, 'incoming mqtt message')

    if (this.isSelfEchoMessage(topic, payload)) {
      log.debug({ topic }, 'skip self-echo mqtt message')
      return
    }

    const responseMatch = await this.resolvePendingRequest(topic, payload)

    if (responseMatch) {
      await this.saveIncomingMessage(
        responseMatch.deviceId,
        topic,
        payload,
        responseMatch.responseMessageId
      )
      log.debug({ topic, commandId: responseMatch.commandId }, 'response matched pending command and persisted')
      return
    }

    if (!this.isPrimaryIngestor) {
      return
    }

    const persisted = await this.ingestDeviceMessage(topic, payload)

    if (!persisted) {
      await this.saveIncomingMessage(undefined, topic, payload)
    }
  }

  private async resolvePendingRequest(topic: string, payload: Record<string, unknown>) {
    for (const [commandId, pending] of this.pendingRequests) {
      if (pending.expectedTopic === topic) {
        if (!this.matchesExpectedPayload(payload, pending.expectedPayloadMatches)) {
          continue
        }

        clearTimeout(pending.timer)
        this.pendingRequests.delete(commandId)

        log.info({ commandId, topic }, 'matched mqtt response for pending command')
        pending.resolve({ topic, payload })

        if (pending.temporarySubscription) {
          void this.unsubscribeTopicSafely(pending.expectedTopic, 'pending response resolved cleanup')
        }

        return {
          commandId,
          deviceId: pending.deviceId,
          responseMessageId: pending.responseMessageId,
        }
      }
    }

    return null
  }

  private getPayloadValueByPath(payload: Record<string, unknown>, path: string) {
    if (!path.trim()) {
      return payload
    }

    const segments = path.split('.').filter(Boolean)
    let current: unknown = payload

    for (const segment of segments) {
      if (!current || typeof current !== 'object') {
        return undefined
      }

      current = (current as Record<string, unknown>)[segment]
    }

    return current
  }

  private matchesExpectedPayload(payload: Record<string, unknown>, expectedMatches?: ExpectedPayloadMatch[]) {
    if (!expectedMatches?.length) {
      return true
    }

    return expectedMatches.every((match) => {
      const actual = this.getPayloadValueByPath(payload, match.path)
      return isDeepStrictEqual(actual, match.value)
    })
  }

  private async ingestDeviceMessage(topic: string, payload: Record<string, unknown>) {
    const match = topic.match(/^device\/([^/]+)\/([^/]+)\/.+$/)
    if (!match) {
      log.debug({ topic }, 'topic does not match ingest pattern, skipped state ingest')
      return false
    }

    const topicTemplateName = match[1]
    const topicDeviceId = match[2]
    if (!topicTemplateName || !topicDeviceId) {
      log.warn({ topic }, 'invalid template or device id in mqtt topic')
      return false
    }

    const [device] = await db
      .select()
      .from(schema.devices)
      .innerJoin(schema.deviceTemplates, $.eq(schema.deviceTemplates.id, schema.devices.templateId))
      .where(
        $.and(
          $.eq(schema.deviceTemplates.name, topicTemplateName),
          $.eq(schema.devices.deviceId, topicDeviceId),
          $.isNull(schema.devices.deletedAt)
        )
      )
      .limit(1)

    if (!device) {
      log.warn({ template: topicTemplateName, deviceId: topicDeviceId, topic }, 'device not found for incoming mqtt message')
      return false
    }

    const resolvedDevice = device.devices
    const template = device.device_templates

    if (!template) {
      log.warn({ deviceId: resolvedDevice.id, templateId: resolvedDevice.templateId }, 'template not found for device')
      return false
    }

    const matchedMessage = template.protocol.messages.find((message) => {
      const expectedTopic = renderTopicTemplate(message.topicTemplate, {
        template: template.name,
        id: resolvedDevice.deviceId,
      })

      return expectedTopic === topic
    })

    const responseMessageIds = new Set<string>()
    template.protocol.messages.forEach((message) => {
      if (message.type === 'request') {
        responseMessageIds.add(message.responseId)
      }
    })

    if (!matchedMessage) {
      await this.saveIncomingMessage(resolvedDevice.id, topic, payload)
      log.debug({ deviceId: resolvedDevice.id, topic }, 'incoming message stored without state update (no report template match)')
      return true
    }

    if (matchedMessage.type === 'request' || matchedMessage.type === 'set' || matchedMessage.type === 'action') {
      log.debug(
        { deviceId: resolvedDevice.id, topic, messageId: matchedMessage.id, messageType: matchedMessage.type },
        'skip persisting incoming cloud-to-device message'
      )
      return true
    }

    if (matchedMessage.type === 'report' && responseMessageIds.has(matchedMessage.id)) {
      await this.saveIncomingMessage(resolvedDevice.id, topic, payload, matchedMessage.id)
      log.debug(
        { deviceId: resolvedDevice.id, topic, messageId: matchedMessage.id },
        'incoming response message persisted in generic ingest path'
      )
      return true
    }

    if (matchedMessage.type === 'report') {
      const currentState = toStateRecord(resolvedDevice.state as Record<string, unknown>)
      const nextState = { ...currentState }

      matchedMessage.fields.forEach((fieldName) => {
        if (Reflect.has(payload, fieldName)) {
          nextState[fieldName] = payload[fieldName]
        }
      })

      await db
        .update(schema.devices)
        .set({
          state: nextState,
          stateUpdatedAt: new Date(),
          isOnline: true,
        })
        .where($.eq(schema.devices.id, resolvedDevice.id))

      log.info({ deviceId: resolvedDevice.id, reportId: matchedMessage.id, topic }, 'device state updated from mqtt report')
    }

    await this.saveIncomingMessage(resolvedDevice.id, topic, payload, matchedMessage.id)
    return true
  }

  private parsePayload(buffer: Buffer): Record<string, unknown> {
    if (!buffer.length) return {}

    try {
      const parsed = JSON.parse(buffer.toString('utf-8'))
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>
      }
      return { value: parsed }
    }
    catch {
      return { raw: buffer.toString('utf-8') }
    }
  }

  private async saveOutgoingMessage(deviceId: number | undefined, topic: string, payload: unknown, parsedMessageId?: string) {
    await db.insert(schema.deviceMessages).values({
      deviceId,
      direction: 'out',
      topic,
      payload,
      parsedMessageId,
    })

    this.rememberOutgoingMessage(topic, payload)

    log.debug({ deviceId, topic, parsedMessageId }, 'outgoing mqtt message persisted')
  }

  private async saveIncomingMessage(deviceId: number | undefined, topic: string, payload: unknown, parsedMessageId?: string) {
    await db.insert(schema.deviceMessages).values({
      deviceId,
      direction: 'in',
      topic,
      payload,
      parsedMessageId,
    })

    log.debug({ deviceId, topic, parsedMessageId }, 'incoming mqtt message persisted')
  }
}

const runtime = new MqttRuntime()

export async function getMqttRuntime() {
  await runtime.start()
  return runtime
}
