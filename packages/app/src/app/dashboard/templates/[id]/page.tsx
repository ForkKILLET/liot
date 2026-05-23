import { ArrowLeft, Pencil } from 'lucide-react'
import { notFound } from 'next/navigation'

import { DeviceTemplateDetail } from '@/comps/dashboard/device-template-detail'
import { ButtonLink } from '@/comps/ui/link'
import { getDeviceTemplateById } from '@/lib/device-templates'
import { getDeviceTemplateDetailPath } from '@/lib/device-templates/url'

export default async function DeviceTemplateDetailPage({
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
          <h1 className='text-2xl font-semibold text-white'>{template.name}</h1>
          <p className='mt-1 text-sm text-muted-foreground'>{template.description || '暂无描述'}</p>
        </div>

        <div className='flex items-center gap-2'>
          <ButtonLink href={`${getDeviceTemplateDetailPath(template.id)}/edit`} variant='outline' icon={Pencil}>
            编辑
          </ButtonLink>
          <ButtonLink href='/dashboard/templates' variant='ghost' icon={ArrowLeft}>
            返回列表
          </ButtonLink>
        </div>
      </div>

      <DeviceTemplateDetail template={template} />
    </div>
  )
}
