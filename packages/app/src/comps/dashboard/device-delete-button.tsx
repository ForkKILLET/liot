'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/comps/ui/button'
import { deleteDevice } from '@/lib/devices'

export function DeviceDeleteButton({
  deviceId,
  deviceName
}: {
  deviceId: number
  deviceName: string
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteDevice(deviceId)
      toast.success(`设备"${deviceName}"已删除`)
      router.push('/dashboard/devices')
    }
    catch (error) {
      toast.error('删除設備失败，请稍后重试')
      console.error('Delete device error:', error)
    }
    finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className='space-y-4'>
        <p className='text-sm text-slate-300'>
          确定要删除设备 <span className='font-semibold text-white'>{deviceName}</span> 吗？该操作无法撤销。
        </p>
        <div className='flex gap-3'>
          <Button
            variant='destructive'
            size='sm'
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className='mr-2 h-4 w-4' />
            {isDeleting ? '删除中...' : '确认删除'}
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowConfirm(false)}
            disabled={isDeleting}
          >取消</Button>
        </div>
      </div>
    )
  }

  return (
    <Button
      variant='destructive'
      size='sm'
      onClick={() => setShowConfirm(true)}
    >
      <Trash2 className='mr-2 h-4 w-4' />
      删除设备
    </Button>
  )
}
