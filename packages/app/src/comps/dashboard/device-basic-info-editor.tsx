'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Input } from '@/comps/ui/input'
import { Textarea } from '@/comps/ui/textarea'
import { updateDeviceBasicInfo } from '@/lib/devices'
import { Button } from '@/comps/ui/button'
import { Save } from 'lucide-react'

export type DeviceBasicInfoEditorProps = {
  deviceId: number
  deviceDisplayId: string
  templateId: number
  templateName: string | null
  creatorDisplay: string
  createdAtDisplay: string
  defaultName: string
  defaultDescription: string | null
}

export function DeviceBasicInfoEditor({
  deviceId,
  deviceDisplayId,
  templateId,
  templateName,
  creatorDisplay,
  createdAtDisplay,
  defaultName,
  defaultDescription,
}: DeviceBasicInfoEditorProps) {
  const router = useRouter()
  const [name, setName] = useState(defaultName)
  const [description, setDescription] = useState(defaultDescription ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const isDirty = name !== defaultName || description !== (defaultDescription ?? '')

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('设备名称不能为空')
      return
    }

    setIsSaving(true)
    try {
      await updateDeviceBasicInfo(deviceId, {
        name,
        description,
      })
      toast.success('设备信息已更新')
      router.refresh()
    }
    catch (error) {
      toast.error('更新失败，请稍后重试')
      console.error('Update device basic info error:', error)
    }
    finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-[7rem_1fr] gap-x-4 gap-y-3 text-sm'>
        <div className='flex h-6 items-center text-muted-foreground font-medium'>设备 ID</div>
        <div className='flex h-6 items-center text-foreground'>{deviceDisplayId}</div>

        <div className='flex h-6 items-center text-muted-foreground font-medium'>型号 ID</div>
        <div className='flex h-6 items-center text-foreground'>{templateId}</div>

        <div className='flex h-6 items-center text-muted-foreground font-medium'>型号名称</div>
        <div className='flex h-6 items-center text-foreground'>{templateName ?? '-'}</div>

        <div className='flex h-6 items-center text-muted-foreground font-medium'>创建时间</div>
        <div className='flex h-6 items-center text-foreground'>{createdAtDisplay}</div>

        <div className='flex h-6 items-center text-muted-foreground font-medium'>创建人</div>
        <div className='flex h-6 items-center text-foreground'>{creatorDisplay}</div>

        <div className='flex h-9 items-center text-muted-foreground font-medium'>名称</div>
        <div>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder='输入设备名称'
            maxLength={64}
            className='h-9'
          />
        </div>

        <div className='flex min-h-9 items-start pt-2 text-muted-foreground font-medium'>描述</div>
        <div>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder='输入设备描述'
            maxLength={500}
            rows={3}
            className='min-h-9'
          />
        </div>
      </div>

      <div>
        <Button
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          variant={isDirty ? 'default' : 'outline'}
        >
          <Save className='h-4 w-4' />
          {isSaving ? '保存中...' : '保存修改'}
        </Button>
      </div>
    </div>
  )
}
