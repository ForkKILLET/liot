'use client'

import { FormProvider, useForm } from 'react-hook-form'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { updateDeviceTemplate } from '@/lib/device-templates'
import { getDeviceTemplateDetailPath } from '@/lib/device-templates/url'
import { DeviceTemplate } from '@/lib/db/schema'
import { InputField } from '@/comps/form/input-field'
import { TextareaField } from '@/comps/form/textarea-field'
import { SubmitButton } from '@/comps/form/submit-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/comps/ui/card'

type EditTemplateValues = {
  name: string
  description: string
  state: string
  protocol: string
}

function formatTemplateJson(value: unknown) {
  return JSON.stringify(value, null, 2)
}

export function DeviceTemplateEditor({
  template,
}: {
  template: DeviceTemplate
}) {
  const router = useRouter()

  const form = useForm<EditTemplateValues>({
    defaultValues: {
      name: template.name,
      description: template.description ?? '',
      state: formatTemplateJson(template.state),
      protocol: formatTemplateJson(template.protocol),
    },
    mode: 'onTouched',
  })

  const handleUpdate = form.handleSubmit(async (values) => {
    try {
      const updatedTemplate = await updateDeviceTemplate(template.id, values)
      toast.success('设备模板已更新')
      router.push(getDeviceTemplateDetailPath(updatedTemplate.id))
      router.refresh()
    }
    catch (error) {
      const message = error instanceof Error ? error.message : '设备模板更新失败，请稍后重试'
      toast.error(message)
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Save className='h-4 w-4' />
          编辑设备模板
        </CardTitle>
        <CardDescription>
          修改模板的基础信息、状态字段和消息协议。
        </CardDescription>
      </CardHeader>

      <CardContent>
        <FormProvider {...form}>
          <form className='space-y-4' onSubmit={handleUpdate}>
            <InputField
              name='name'
              label='模板名称'
              role='text'
              rules={{ required: '请输入模板名称' }}
            />

            <TextareaField
              name='description'
              label='模板描述'
              rows={2}
            />

            <TextareaField
              name='state'
              label='State JSON'
              rows={10}
              className='font-mono text-xs'
              rules={{ required: '请输入 state JSON' }}
            />

            <TextareaField
              name='protocol'
              label='Protocol JSON'
              rows={12}
              className='font-mono text-xs'
              rules={{ required: '请输入 protocol JSON' }}
            />

            <SubmitButton
              isPending={form.formState.isSubmitting}
              icon={Save}
              className='w-auto'
            >
              保存修改
            </SubmitButton>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  )
}
