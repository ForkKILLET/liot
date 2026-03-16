import { type Device } from '@/lib/db/schema'
import { DescriptionItem, Descriptions } from '../ui/descriptions'
import { Card, CardContent } from '../ui/card'

export type DeviceProps = {
  device: Device
}

export function Device({
  device,
}: DeviceProps) {
  return (
    <Card>
      <CardContent>
        <Descriptions>
          <DescriptionItem label="名称">
            {device.name}
          </DescriptionItem>
          <DescriptionItem label="描述">
            {device.description || '-'}
          </DescriptionItem>
          <DescriptionItem label="型号">
            {device.templateId}
          </DescriptionItem>
        </Descriptions>
      </CardContent>
    </Card>
  )
}
