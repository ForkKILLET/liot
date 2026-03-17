import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import pino from 'pino'

const logPath = resolve(process.cwd(), process.env.APP_LOG_PATH || 'logs/app.log')
mkdirSync(dirname(logPath), { recursive: true })

export const logger = pino({
  level: process.env.APP_LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      destination: logPath,
      colorize: false,
      translateTime: 'yyyy-mm-dd HH:MM:ss.l',
      ignore: 'hostname',
      singleLine: false,
    },
  },
})

export function createLogger(scope: string) {
  return logger.child({ scope })
}
