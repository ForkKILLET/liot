import { NextResponse } from 'next/server'

import { getDeviceMessagesHistory } from '@/lib/devices'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const deviceId = Number(id)

    if (!Number.isFinite(deviceId)) {
      return NextResponse.json({ success: false, message: '无效的设备 ID' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || 1)
    const pageSize = Number(searchParams.get('pageSize') || 20)

    if (!Number.isFinite(page) || page < 1 || !Number.isFinite(pageSize) || pageSize < 1) {
      return NextResponse.json({ success: false, message: '无效的分页参数' }, { status: 400 })
    }

    const data = await getDeviceMessagesHistory({
      deviceId,
      page,
      pageSize,
    })

    return NextResponse.json({
      success: true,
      data,
    })
  }
  catch (error) {
    const message = error instanceof Error ? error.message : '消息历史查询失败'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
