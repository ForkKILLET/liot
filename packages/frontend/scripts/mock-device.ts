import { connect } from 'mqtt'

const mqttUrl = process.env.MQTT_URL || 'mqtt://127.0.0.1:1883'
const templateName = process.env.MOCK_TEMPLATE_NAME || 'SRTP-1'
const deviceId = Number(process.env.MOCK_DEVICE_ID || '1')
const intervalMs = Number(process.env.MOCK_TELEMETRY_INTERVAL_MS || '30000')
const responseDelayMinMs = Number(process.env.MOCK_RESPONSE_DELAY_MIN_MS || '1000')
const responseDelayMaxMs = Number(process.env.MOCK_RESPONSE_DELAY_MAX_MS || '3000')

const telemetryTopic = `device/${templateName}/${deviceId}/telemetry`
const statusRequestTopic = `device/${templateName}/${deviceId}/status/request`
const statusResponseTopic = `device/${templateName}/${deviceId}/status/response`

const client = connect(mqttUrl)

let flow = Number(process.env.MOCK_FLOW_START || '128.321')
let battery = Number(process.env.MOCK_BATTERY_START || '96')

function publishTelemetry() {
  flow += Math.random() * 0.2
  battery = Math.max(0, battery - Math.random() * 0.05)

  const payload = {
    version: 1,
    flow: Number(flow.toFixed(3)),
  }

  client.publish(telemetryTopic, JSON.stringify(payload))
  console.log('[mock-device] telemetry ->', telemetryTopic, payload)
}

client.on('connect', () => {
  console.log('[mock-device] connected:', mqttUrl)
  client.subscribe(statusRequestTopic)
  console.log('[mock-device] subscribe:', statusRequestTopic)

  publishTelemetry()
  setInterval(publishTelemetry, intervalMs)
})

client.on('message', (topic, raw) => {
  if (topic !== statusRequestTopic) return

  const requestPayload = raw.toString('utf8')
  console.log('[mock-device] request <-', topic, requestPayload)

  const responsePayload = {
    version: 1,
    flow: Number(flow.toFixed(3)),
    battery: Number(battery.toFixed(1)),
  }

  const minDelay = Math.max(0, Math.min(responseDelayMinMs, responseDelayMaxMs))
  const maxDelay = Math.max(responseDelayMinMs, responseDelayMaxMs)
  const responseDelay = Math.floor(minDelay + Math.random() * (maxDelay - minDelay + 1))

  console.log('[mock-device] response scheduled ->', statusResponseTopic, { responseDelay, responsePayload })
  setTimeout(() => {
    client.publish(statusResponseTopic, JSON.stringify(responsePayload))
    console.log('[mock-device] response ->', statusResponseTopic, responsePayload)
  }, responseDelay)
})

client.on('error', (error: Error) => {
  console.error('[mock-device] error:', error)
})
