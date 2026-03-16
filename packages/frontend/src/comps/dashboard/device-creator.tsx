'use client'

import { useForm, FormProvider } from 'react-hook-form'
import { Save } from 'lucide-react'

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
      name: '',
      description: '',
      templateId: undefined,
    },
    mode: 'onTouched',
  })

  const handleSubmit = form.handleSubmit(onSave)

  return (
    <div
      {...props}
      className='lg:mr-40'
    >
      <FormProvider {...form}>
        <form onSubmit={handleSubmit} className='space-y-6'>
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
