import { getDeviceCommandById } from '@/lib/devices'

export const runtime = 'nodejs'

const encoder = new TextEncoder()

function toSseEvent(data: unknown) {
  return encoder.encode(`event: command\ndata: ${JSON.stringify(data)}\n\n`)
}

function isTerminalStatus(status: string) {
  return status === 'success' || status === 'failed' || status === 'timeout'
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const commandId = Number(id)

  if (!Number.isFinite(commandId)) {
    return new Response('Invalid command id', { status: 400 })
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false
      let lastSnapshot = ''

      const close = () => {
        if (closed) return
        closed = true
        controller.close()
      }

      const sendSnapshot = async () => {
        try {
          const command = await getDeviceCommandById(commandId)
          const snapshot = {
            commandId: command.id,
            status: command.status,
            error: command.error,
            updatedAt: command.updatedAt,
          }

          const serialized = JSON.stringify(snapshot)
          if (serialized !== lastSnapshot) {
            controller.enqueue(toSseEvent(snapshot))
            lastSnapshot = serialized
          }

          if (isTerminalStatus(command.status)) {
            close()
          }
        }
        catch {
          controller.enqueue(toSseEvent({
            commandId,
            status: 'failed',
            error: '命令查询失败',
          }))
          close()
        }
      }

      await sendSnapshot()

      if (closed) return

      const interval = setInterval(async () => {
        if (closed) return
        await sendSnapshot()
      }, 1000)

      const heartbeat = setInterval(() => {
        if (closed) return
        controller.enqueue(encoder.encode(': keep-alive\n\n'))
      }, 15000)

      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        clearInterval(heartbeat)
        close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
