import { DeviceTemplateListClient } from '@/comps/dashboard/device-template-list-client'
import { getDeviceTemplates } from '@/lib/device-templates'

export default async function DeviceTemplatesPage() {
  const templates = await getDeviceTemplates()

  return <DeviceTemplateListClient templates={templates} />
}
