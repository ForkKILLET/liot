import { Plus } from 'lucide-react'

import { ButtonLink } from '@/comps/ui/link'
import { getSession } from '@/lib/auth/server'
import { getUserDevices } from '@/lib/devices'
import { getDeviceTemplates } from '@/lib/device-templates'
import { DeviceListClient } from '@/comps/dashboard/device-list-client'

export default async function DevicesPage() {
  const { user } = await getSession()

  const userDevices = await getUserDevices(user.id)
  const templates = await getDeviceTemplates()

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold text-white'>设备管理</h1>
        <ButtonLink href='/dashboard/devices/new' icon={Plus}>添加设备</ButtonLink>
      </div>

      <DeviceListClient devices={userDevices} templates={templates} />
    </div>
  )
}
