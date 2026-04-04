'use client'

import { FormProvider, useForm } from 'react-hook-form'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { createDeviceTemplate } from '@/lib/device-templates'
import { InputField } from '@/comps/form/input-field'
import { TextareaField } from '@/comps/form/textarea-field'
import { SubmitButton } from '@/comps/form/submit-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/comps/ui/card'

type CreateTemplateValues = {
  name: string
  description: string
  state: string
  protocol: string
}

const DEFAULT_STATE_JSON = '{\n  "fields": []\n}'
const DEFAULT_PROTOCOL_JSON = '{\n  "messages": []\n}'

export function DeviceTemplateCreator() {
  const router = useRouter()

  const form = useForm<CreateTemplateValues>({
    defaultValues: {
      name: '',
      description: '',
      state: DEFAULT_STATE_JSON,
      protocol: DEFAULT_PROTOCOL_JSON,
    },
    mode: 'onTouched',
  })

  const handleCreate = form.handleSubmit(async (values) => {
    try {
      await createDeviceTemplate(values)
      toast.success('设备模板创建成功')
      router.push('/dashboard/templates')
      router.refresh()
    }
    catch (error) {
      const message = error instanceof Error ? error.message : '设备模板创建失败，请稍后重试'
      toast.error(message)
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Plus className='h-4 w-4' />
          创建设备模板
        </CardTitle>
        <CardDescription>
          通过 JSON 定义模板的状态字段和消息协议。
        </CardDescription>
      </CardHeader>

      <CardContent>
        <FormProvider {...form}>
          <form className='space-y-4' onSubmit={handleCreate}>
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
              icon={Plus}
              className='w-auto'
            >
              创建设备模板
            </SubmitButton>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  )
}
