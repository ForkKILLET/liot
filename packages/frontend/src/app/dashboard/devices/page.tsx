import { Plus } from 'lucide-react'

import { ButtonLink } from '@/comps/ui/link'
import { getSession } from '@/lib/auth/server'
import { getUserDevices } from '@/lib/devices'
import { Device } from '@/comps/dashboard/device'

export default async function DevicesPage() {
  const { user } = await getSession()

  const userDevices = await getUserDevices(user.id)

  return (
    <div className='space-y-4 lg:mr-40'>
      <ButtonLink href='/dashboard/devices/new' icon={Plus}>添加设备</ButtonLink>

      <div className='grid md:grid-cols-2'>
        {userDevices.map(device => (
          <Device key={device.id} device={device} />
        ))}
      </div>
    </div>
  )
}
