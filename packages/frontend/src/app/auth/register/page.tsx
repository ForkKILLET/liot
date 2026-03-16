'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserRoundPlus } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'

import { InputField } from '@/comps/form/input-field'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/comps/ui/card'
import { TextLink } from '@/comps/ui/link'
import { SiteShell } from '@/comps/site-shell'
import { authClient } from '@/lib/auth/client'
import { SubmitButton } from '@/comps/form/submit-button'

interface RegisterFormData {
  email: string
  name: string
  password: string
  passwordConfirm: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const form = useForm<RegisterFormData>({
    mode: 'onTouched',
  })

  const router = useRouter()
  const session = authClient.useSession()
  const [serverMessage, setServerMessage] = useState<string | null>(null)

  useEffect(() => {
    if (session.data) {
      router.replace('/dashboard')
    }
  }, [session.data, router])

  const onSubmit = form.handleSubmit(async ({ email, name, password }) => {
    form.clearErrors()
    setServerMessage(null)

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      })

      if (result.error) {
        form.setError('root', { message: result.error.message ?? '注册失败，请稍后再试' })
        return
      }

      setServerMessage('注册成功，正在跳转到控制台...')
      setTimeout(() => router.push('/dashboard'), 800)
    }
    catch (error) {
      console.error('Register request failed', error)
      form.setError('root', { message: '网络错误，请稍后再试' })
    }
  })

  return (
    <SiteShell>
      <Card>
        <CardHeader className='pb-2 text-center'>
          <CardTitle className='text-2xl text-white'>注册新 Liot 账户</CardTitle>
        </CardHeader>

        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={onSubmit} className='space-y-6'>
              <InputField
                name='email'
                label='邮箱'
                role='email'
                rules={{
                  required: '请输入邮箱地址',
                  pattern: {
                    value: emailPattern,
                    message: '请输入有效的邮箱地址',
                  },
                }}
              />

              <InputField
                name='name'
                label='用户名'
                role='username'
                rules={{
                  required: '请输入用户名',
                  minLength: {
                    value: 3,
                    message: '用户名至少 3 个字符',
                  },
                  maxLength: {
                    value: 20,
                    message: '用户名最多 20 个字符',
                  },
                }}
              />

              <InputField
                name='password'
                label='密码'
                role='password'
                hint='至少 8 位字符'
                rules={{
                  required: '请输入密码',
                  minLength: {
                    value: 8,
                    message: '密码至少 8 位字符',
                  },
                }}
              />

              <InputField
                name='passwordConfirm'
                label='确认密码'
                role='password'
                rules={{
                  required: '请确认密码',
                  validate: (value) => value === form.getValues('password') || '两次输入的密码不匹配',
                }}
              />

              {form.formState.errors.root?.message && (
                <p className='text-center text-sm text-destructive' role='alert'>
                  {form.formState.errors.root.message}
                </p>
              )}

              {serverMessage && (
                <p className='text-center text-sm text-emerald-400' role='status'>
                  {serverMessage}
                </p>
              )}

              <SubmitButton
                isPending={form.formState.isSubmitting || session.isPending}
                icon={UserRoundPlus}
              >
                注册
              </SubmitButton>
            </form>
          </FormProvider>
        </CardContent>

        <CardFooter className='border-slate-800 text-sm text-slate-400'>
          <p className='w-full text-center'>
            已有账户？
            <TextLink href='/auth/login'>登录</TextLink>
          </p>
        </CardFooter>
      </Card>
    </SiteShell>
  )
}
