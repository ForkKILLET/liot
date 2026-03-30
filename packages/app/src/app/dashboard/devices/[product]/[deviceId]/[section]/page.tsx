import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

import { DeviceDetailTabs } from '@/comps/dashboard/device-detail-tabs'
import { ButtonLink } from '@/comps/ui/link'
import { getRequestMessages } from '@/lib/device-templates/protocol'
import { getDeviceDetailByProductAndDeviceId } from '@/lib/devices'

const sections = ['properties', 'status', 'messages'] as const

type Section = typeof sections[number]

function isSection(value: string): value is Section {
  return sections.includes(value as Section)
}

export default async function DeviceDetailSectionPage({
  params,
}: {
  params: Promise<{ product: string, deviceId: string, section: string }>
}) {
  const { product, deviceId, section } = await params

  if (!isSection(section)) {
    notFound()
  }

  const { device, creator, template } = await getDeviceDetailByProductAndDeviceId(product, deviceId)
  const requestMessages = template ? getRequestMessages(template.protocol) : []

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold text-white'>{device.name}</h1>
        <ButtonLink href='/dashboard/devices' variant='ghost' icon={ArrowLeft}>
          返回列表
        </ButtonLink>
      </div>

      <DeviceDetailTabs
        section={section}
        deviceId={device.id}
        deviceName={device.name}
        deviceDescription={device.description}
        device={device}
        creator={creator}
        template={template}
        requestMessages={requestMessages}
      />
    </div>
  )
}
