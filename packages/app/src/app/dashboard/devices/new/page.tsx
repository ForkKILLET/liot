import { ArrowLeft } from 'lucide-react'

import { DeviceEditor } from '@/comps/dashboard/device-creator'
import { ButtonLink } from '@/comps/ui/link'
import { getDeviceTemplates } from '@/lib/device-templates'
import { createDeviceUnderCurrentUser } from '@/lib/devices'

export default async function NewDevicePage() {
  const templates = await getDeviceTemplates()

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold text-white'>创建设备</h1>
        <ButtonLink href='/dashboard/devices' variant='ghost' icon={ArrowLeft}>返回列表</ButtonLink>
      </div>

      <DeviceEditor
        templates={templates}
        onSave={createDeviceUnderCurrentUser}
      />
    </div>
  )
}
