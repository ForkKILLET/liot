import { getSession } from '@/lib/auth/server'
import { getUserDevices } from '@/lib/devices'
import { getDeviceTemplates } from '@/lib/device-templates'
import { DeviceListClient } from '@/comps/dashboard/device-list-client'

export default async function DevicesPage() {
  const { user } = await getSession()

  const userDevices = await getUserDevices(user.id)
  const templates = await getDeviceTemplates()

  return <DeviceListClient devices={userDevices} templates={templates} />
}
