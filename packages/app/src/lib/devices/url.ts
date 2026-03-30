type DeviceDetailSection = 'properties' | 'status' | 'messages'

export function getDeviceDetailPath(product: string, deviceId: string, section?: DeviceDetailSection) {
  const productSegment = encodeURIComponent(product)
  const deviceIdSegment = encodeURIComponent(deviceId)
  const base = `/dashboard/devices/${productSegment}/${deviceIdSegment}`

  if (!section) {
    return base
  }

  return `${base}/${section}`
}
