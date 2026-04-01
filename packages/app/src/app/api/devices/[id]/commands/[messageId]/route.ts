import { NextResponse } from 'next/server'

import { enqueueDeviceRequestCommand } from '@/lib/devices'
import { DeviceCommandEnqueueResponse } from '@/lib/api/contracts'

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string, messageId: string }> }
) {
  try {
    const { id, messageId } = await context.params
    const deviceId = Number(id)

    if (!Number.isFinite(deviceId)) {
      return NextResponse.json<DeviceCommandEnqueueResponse>({ success: false, message: '无效的设备 ID' }, { status: 400 })
    }

    const result = await enqueueDeviceRequestCommand({
      deviceId,
      messageId,
    })

    return NextResponse.json<DeviceCommandEnqueueResponse>({
      success: true,
      data: result,
    })
  }
  catch (error) {
    const message = error instanceof Error ? error.message : '命令执行失败'
    return NextResponse.json<DeviceCommandEnqueueResponse>({ success: false, message }, { status: 500 })
  }
}
