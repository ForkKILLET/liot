import { connect } from 'mqtt'
import pg from 'pg'

const mqttUrl = process.env.MQTT_URL || 'mqtt://127.0.0.1:1883'
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

const templateName = process.env.E2E_TEMPLATE_NAME || 'SRTP-1'
const deviceId = Number(process.env.E2E_DEVICE_ID || '1')
const timeoutMs = Number(process.env.E2E_TIMEOUT_MS || '8000')

const telemetryTopic = `device/${templateName}/${deviceId}/telemetry`
const telemetryPayload = {
  version: 1,
  flow: Number((100 + Math.random() * 10).toFixed(3)),
}

type DeviceRow = {
  state: Record<string, unknown> | null
  state_updated_at: string | null
}

const { Client } = pg
const dbClient = new Client({ connectionString: databaseUrl })
const mqttClient = connect(mqttUrl)

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function waitForStateUpdate() {
  const started = Date.now()

  while (Date.now() - started < timeoutMs) {
    const result = await dbClient.query<DeviceRow>(
      'select state, state_updated_at from devices where id = $1 and deleted_at is null limit 1',
      [deviceId],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error(`device ${deviceId} not found`)
    }

    const state = row.state || {}
    const flow = state['flow']
    if (typeof flow === 'number' && Math.abs(flow - telemetryPayload.flow) < 0.0001) {
      return row
    }

    await delay(400)
  }

  throw new Error('state update timeout')
}

async function main() {
  await dbClient.connect()

  await new Promise<void>((resolve, reject) => {
    mqttClient.once('connect', () => resolve())
    mqttClient.once('error', (error) => reject(error))
  })

  mqttClient.publish(telemetryTopic, JSON.stringify(telemetryPayload))
  console.log('[e2e-ingest] telemetry sent:', telemetryTopic, telemetryPayload)

  const row = await waitForStateUpdate()
  console.log('[e2e-ingest] state updated:', row.state, 'updatedAt:', row.state_updated_at)

  await dbClient.end()
  mqttClient.end(true)
}

void main().catch(async (error: unknown) => {
  console.error('[e2e-ingest] failed:', error)
  await dbClient.end()
  mqttClient.end(true)
  process.exit(1)
})
