import { NextResponse } from 'next/server'

import { getDeviceStateHistory } from '@/lib/devices'

export const runtime = 'nodejs'

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
    const fieldsParam = searchParams.get('fields') || ''
    const fields = fieldsParam
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    if (!fields.length) {
      return NextResponse.json({ success: false, message: '至少选择一个字段' }, { status: 400 })
    }

    const windowMinutesParam = searchParams.get('windowMinutes')
    const windowMinutes = Number(windowMinutesParam)
    const safeWindowMinutes = windowMinutesParam && Number.isFinite(windowMinutes) && windowMinutes > 0
      ? Math.min(windowMinutes, 24 * 60)
      : undefined

    const limitParam = searchParams.get('limit')
    const limit = Number(limitParam)
    const safeLimit = limitParam && Number.isFinite(limit) && limit > 0
      ? Math.min(limit, 2000)
      : 10

    const to = new Date()
    const from = safeWindowMinutes
      ? new Date(to.getTime() - safeWindowMinutes * 60 * 1000)
      : new Date(to.getTime() - 24 * 60 * 60 * 1000)

    const data = await getDeviceStateHistory({
      deviceId,
      fields,
      from,
      to,
      limit: safeLimit,
    })

    return NextResponse.json({
      success: true,
      data,
    })
  }
  catch (error) {
    const message = error instanceof Error ? error.message : '查询状态历史失败'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
