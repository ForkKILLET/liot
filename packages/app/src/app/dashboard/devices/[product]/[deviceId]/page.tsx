import { redirect } from 'next/navigation'

import { getDeviceDetailPath } from '@/lib/devices/url'

export default async function DeviceDetailPage({
  params
}: {
  params: Promise<{ product: string, deviceId: string }>
}) {
  const { product, deviceId } = await params
  redirect(getDeviceDetailPath(product, deviceId, 'properties'))
}
