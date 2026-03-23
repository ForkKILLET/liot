import { NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'

const log = createLogger('api-error')

export function handleInternalError(error: unknown) {
  log.error({ error }, 'internal error')

  return NextResponse.json({
    success: false,
    message: '服务器错误，请稍后再试',
  }, { status: 500 })
}

export class ErrorHandler {
  static handle(error: unknown) {
    return handleInternalError(error)
  }

  static wrap<Args extends unknown[]>(
    fn: (...args: Args) => Promise<NextResponse>
  ): (...args: Args) => Promise<NextResponse> {
    return async (...args: Args): Promise<NextResponse> => {
      try {
        return await fn(...args)
      }
      catch (error) {
        return this.handle(error)
      }
    }
  }
}
