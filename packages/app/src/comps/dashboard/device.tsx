import Link from 'next/link'
import { type Device } from '@/lib/db/schema'
import { DescriptionItem, Descriptions } from '../ui/descriptions'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

export type DeviceProps = {
  device: Device
  templateName?: string
}

export function Device({
  device,
  templateName,
}: DeviceProps) {
  return (
    <Link href={`/dashboard/devices/${device.id}`}>
      <Card className='border-border bg-card transition-all hover:border-border hover:bg-accent hover:shadow-lg'>
        <CardHeader className='pb-2'>
          <div className='flex items-center justify-between gap-2'>
            <CardTitle className='truncate text-base text-foreground'>{device.name}</CardTitle>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              device.isOnline
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-muted text-muted-foreground'
            }`}>
              {device.isOnline ? '在线' : '离线'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Descriptions>
            <DescriptionItem label='设备 ID'>
              {device.id}
            </DescriptionItem>
            <DescriptionItem label='描述'>
              {device.description || '-'}
            </DescriptionItem>
            <DescriptionItem label='型号'>
              {templateName ?? '-'}
            </DescriptionItem>
          </Descriptions>
        </CardContent>
      </Card>
    </Link>
  )
}
