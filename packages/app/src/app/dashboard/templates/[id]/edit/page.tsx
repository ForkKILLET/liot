import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

import { DeviceTemplateEditor } from '@/comps/dashboard/device-template-editor'
import { ButtonLink } from '@/comps/ui/link'
import { getDeviceTemplateById } from '@/lib/device-templates'
import { getDeviceTemplateDetailPath } from '@/lib/device-templates/url'

export default async function EditDeviceTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const templateId = Number.parseInt(id, 10)

  if (!Number.isInteger(templateId) || templateId <= 0) {
    notFound()
  }

  const template = await getDeviceTemplateById(templateId)
  if (!template) {
    notFound()
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-semibold text-white'>编辑设备模板</h1>
          <p className='mt-1 text-sm text-muted-foreground'>{template.name}</p>
        </div>

        <ButtonLink href={getDeviceTemplateDetailPath(template.id)} variant='ghost' icon={ArrowLeft}>
          返回详情
        </ButtonLink>
      </div>

      <DeviceTemplateEditor template={template} />
    </div>
  )
}
