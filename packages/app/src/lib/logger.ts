import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import pino from 'pino'

const logPath = resolve(process.cwd(), process.env.APP_LOG_PATH || 'logs/app.log')
mkdirSync(dirname(logPath), { recursive: true })

const baseOptions = {
  level: process.env.APP_LOG_LEVEL || 'info',
}

export const logger = pino(baseOptions, pino.destination(logPath))

export function createLogger(scope: string) {
  return logger.child({ scope })
}
