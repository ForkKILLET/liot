import { DeviceEditor } from '@/comps/dashboard/device-creator'
import { getDeviceTemplates } from '@/lib/device-templates'
import { createDeviceUnderCurrentUser } from '@/lib/devices'

export default async function NewDevicePage() {
  const templates = await getDeviceTemplates()

  return (
    <>
      <DeviceEditor
        templates={templates}
        onSave={createDeviceUnderCurrentUser}
      />
    </>
  )
}
