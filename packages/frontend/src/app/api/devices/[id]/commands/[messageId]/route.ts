import { NextResponse } from 'next/server'

import { enqueueDeviceRequestCommand } from '@/lib/devices'

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string, messageId: string }> }
) {
  try {
    const { id, messageId } = await context.params
    const deviceId = Number(id)

    if (!Number.isFinite(deviceId)) {
      return NextResponse.json({ success: false, message: '无效的设备 ID' }, { status: 400 })
    }

    const result = await enqueueDeviceRequestCommand({
      deviceId,
      messageId,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  }
  catch (error) {
    const message = error instanceof Error ? error.message : '命令执行失败'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
