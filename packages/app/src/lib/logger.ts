import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import pino from 'pino'

const logPath = resolve(process.cwd(), process.env.APP_LOG_PATH || 'logs/app.log')
mkdirSync(dirname(logPath), { recursive: true })

const shouldUsePretty = process.env.NODE_ENV !== 'production'

const baseOptions = {
  level: process.env.APP_LOG_LEVEL || 'info',
}

export const logger = shouldUsePretty
  ? pino({
    ...baseOptions,
    transport: {
      target: 'pino-pretty',
      options: {
        destination: logPath,
        colorize: true,
        translateTime: 'yyyy-mm-dd HH:MM:ss.l',
        ignore: 'hostname',
        singleLine: false,
      },
    },
  })
  : pino(baseOptions, pino.destination(logPath))

export function createLogger(scope: string) {
  return logger.child({ scope })
}
