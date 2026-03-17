import { DeviceField } from '@/lib/db/schema'
import { formatStateFieldValue, toStateRecord } from '@/lib/device-templates/protocol'
import { LineChart } from 'lucide-react'
import { Button } from '@/comps/ui/button'

export type DeviceStateFieldsProps = {
  fields: DeviceField[]
  state: Record<string, unknown> | null | undefined
  selectedChartFields?: string[]
  onToggleChartField?: (fieldName: string) => void
}

export function DeviceStateFields({
  fields,
  state,
  selectedChartFields = [],
  onToggleChartField,
}: DeviceStateFieldsProps) {
  const stateRecord = toStateRecord(state)

  if (!fields.length) {
    return <p className='text-sm text-slate-400'>该型号未定义状态字段。</p>
  }

  return (
    <div className='grid grid-cols-[7rem_1fr] gap-x-4 gap-y-3 text-sm'>
      {fields.map((field) => {
        const value = formatStateFieldValue(field, stateRecord)

        return (
          <div key={field.field} className='contents'>
            <div className='flex h-9 items-center text-muted-foreground font-medium'>
              {field.label}
            </div>
            <div className='flex h-9 items-center justify-between gap-2 text-foreground'>
              {value}
              {field.type === 'number' && onToggleChartField && (
                <Button
                  size='icon-sm'
                  variant={selectedChartFields.includes(field.field) ? 'secondary' : 'ghost'}
                  className='shrink-0'
                  onClick={() => onToggleChartField(field.field)}
                  title={selectedChartFields.includes(field.field) ? '关闭图表' : '开启图表'}
                >
                  <LineChart className='h-4 w-4' />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
