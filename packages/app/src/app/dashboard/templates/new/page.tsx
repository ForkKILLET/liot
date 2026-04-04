import { ArrowLeft } from 'lucide-react'

import { DeviceTemplateCreator } from '@/comps/dashboard/device-template-creator'
import { ButtonLink } from '@/comps/ui/link'

export default function NewDeviceTemplatePage() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold text-white'>创建设备模板</h1>
        <ButtonLink href='/dashboard/templates' variant='ghost' icon={ArrowLeft}>返回列表</ButtonLink>
      </div>

      <DeviceTemplateCreator />
    </div>
  )
}
