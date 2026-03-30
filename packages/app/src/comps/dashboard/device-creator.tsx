'use client'

import { useForm, FormProvider } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { toast } from 'sonner'

import { DeviceTemplate } from '@/lib/db/schema'
import { InputField } from '@/comps/form/input-field'
import { TextareaField } from '@/comps/form/textarea-field'
import { SelectField } from '@/comps/form/select-field'
import { SubmitButton } from '@/comps/form/submit-button'
import { DefineDeviceUnderCurrentUser } from '@/lib/devices'

export type DeviceEditorProps = {
  templates: DeviceTemplate[]
  onSave: (device: DefineDeviceUnderCurrentUser) => Promise<void>
}

export function DeviceEditor({
  templates,
  onSave,
  ...props
}: DeviceEditorProps) {
  const form = useForm<DefineDeviceUnderCurrentUser>({
    defaultValues: {
      deviceId: '',
      name: '',
      description: '',
      templateId: undefined,
    },
    mode: 'onTouched',
  })

  const router = useRouter()

  const handleSubmit = form.handleSubmit(async (values) => {
    form.clearErrors('deviceId')

    try {
      await onSave(values)
      toast.success('设备添加成功')
      router.push('/dashboard/devices')
    }
    catch (error) {
      const message = error instanceof Error ? error.message : '设备添加失败，请稍后重试'

      if (message.includes('设备 ID')) {
        form.setError('deviceId', {
          type: 'server',
          message,
        })
      }

      toast.error(message)
    }
  })

  return (
    <div
      {...props}
      className='lg:mr-40'
    >
      <FormProvider {...form}>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <InputField
            name='deviceId'
            label='设备 ID'
            role='text'
            description='设备绑定的 ID，创建后不可修改。'
            rules={{
              required: '请输入设备 ID',
              pattern: {
                value: /^[a-zA-Z0-9_-]+$/,
                message: '设备 ID 仅支持字母、数字、- 和 _',
              },
            }}
          />

          <InputField
            name='name'
            label='设备名称'
            role='text'
            rules={{ required: '请输入设备名称' }}
          />

          <SelectField
            name='templateId'
            label='设备型号'
            options={templates.map(template => ({
              label: template.name,
              value: String(template.id)
            }))}
            valueType='number'
            rules={{ required: '请选择设备型号' }}
          />

          <TextareaField
            name='description'
            label='设备描述'
          />

          <SubmitButton
            isPending={form.formState.isSubmitting}
            icon={Save}
            className='width-auto'
          >
            保存
          </SubmitButton>
        </form>
      </FormProvider>
    </div>
  )
}
