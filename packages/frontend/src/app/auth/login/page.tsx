'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'
import * as motion from 'framer-motion/client'
import { FormProvider, useForm } from 'react-hook-form'

import { InputField } from '@/comps/form/input-field'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/comps/ui/card'
import { TextLink } from '@/comps/ui/link'
import { SiteShell } from '@/comps/site-shell'
import { authClient } from '@/lib/auth/client'
import { SubmitButton } from '@/comps/form/submit-button'

interface LoginFormData {
  email: string
  password: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const form = useForm<LoginFormData>({
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

  const onSubmit = form.handleSubmit(async (values) => {
    form.clearErrors()
    setServerMessage(null)

    const result = await authClient.signIn.email(values)

    if (result.error) {
      form.setError('root', { message: result.error.message ?? '登录失败，请稍后再试' })
      return
    }

    setServerMessage('登录成功，正在跳转...')
    setTimeout(() => router.push('/dashboard'), 600)
  })

  return (
    <SiteShell>
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className='py-16'
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45 }}
          className='mx-auto w-full max-w-md'
        >
          <Card className='border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/30 backdrop-blur'>
            <CardHeader className='pb-2 text-center'>
              <CardTitle className='text-2xl text-white'>登录 Liot</CardTitle>
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
                    icon={LogIn}
                  >
                    登录
                  </SubmitButton>
                </form>
              </FormProvider>
            </CardContent>

            <CardFooter className='border-slate-800 text-sm text-slate-400'>
              <p className='w-full text-center'>
                还没有账户？
                <TextLink href='/auth/register'>立即注册</TextLink>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.section>
    </SiteShell>
  )
}
