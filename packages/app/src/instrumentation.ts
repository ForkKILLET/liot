export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return
  }

  const { createLogger } = await import('@/lib/logger')
  const log = createLogger('instrumentation')

  try {
    const { getMqttRuntime } = await import('@/lib/mqtt/runtime')
    await getMqttRuntime()
    log.info('mqtt runtime initialized on server startup')
  }
  catch (error) {
    log.error({ error }, 'mqtt runtime initialization failed on server startup')
  }
}
