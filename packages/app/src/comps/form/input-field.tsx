'use client'

import { cloneElement, ReactElement, ReactNode, useState } from 'react'
import {
  Controller,
  RegisterOptions,
  useFormContext,
  type FieldValues,
} from 'react-hook-form'
import { Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react'

import { Input } from '@/comps/ui/input'
import { cn } from '@/lib/utils'

type InputFieldRole = 'text' | 'password' | 'email' | 'username'

type GenericFieldValues = FieldValues & Record<string, unknown>

type InputProps = React.ComponentProps<typeof Input>

export interface InputFieldProps extends Omit<InputProps, 'name' | 'type' | 'defaultValue'> {
  name: string
  label: ReactNode
  role: InputFieldRole
  icon?: ReactElement
  description?: ReactNode
  hint?: ReactNode
  rules?: RegisterOptions<GenericFieldValues>
  containerClassName?: string
  labelClassName?: string
  descriptionClassName?: string
  hintClassName?: string
}

export function InputField({
  name,
  label,
  role,
  icon,
  description,
  placeholder,
  hint,
  rules,
  containerClassName,
  labelClassName,
  descriptionClassName,
  hintClassName,
  className,
  id,
  autoComplete,
  inputMode,
  spellCheck,
  ...rest
}: InputFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const { control } = useFormContext<GenericFieldValues>()

  const inputId = id ?? name

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(prev => ! prev)
  }

  const autoCompleteComputed = autoComplete ?? {
    text: 'off',
    email: 'email',
    password: 'current-password',
    username: 'username',
  }[role]

  const inputModeComputed = inputMode ?? (role === 'email' ? 'email' : 'text')
  const spellCheckComputed = spellCheck ?? (role === 'text')

  const descriptionId = description ? `${inputId}-description` : undefined

  const iconComputed = icon ?? {
    text: undefined,
    email: <Mail />,
    password: <Lock />,
    username: <UserRound />,
  }[role]

  const placeholderComputed = placeholder ?? {
    text: '',
    email: 'you@example.com',
    password: '••••••••',
    username: 'You',
  }[role]

  const iconStyled = iconComputed && cloneElement(iconComputed, {
    className: 'h-4 w-4 text-slate-400',
  })

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const { value, onChange, onBlur, name: fieldName } = field

        const inputType = role === 'password'
          ? (isPasswordVisible ? 'text' : 'password')
          : role
        const fieldError = fieldState.error
        const errorId = fieldError ? `${inputId}-error` : undefined
        const ariaDescribedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined

        return (
          <div className={cn('space-y-1', containerClassName)}>
            <label
              htmlFor={inputId}
              className={cn('block text-sm font-medium text-slate-200', labelClassName)}
            >
              {label}
            </label>

            {description && (
              <p
                id={descriptionId}
                className={cn('text-xs text-slate-400', descriptionClassName)}
              >
                {description}
              </p>
            )}

            <div className='relative'>
              {iconStyled && (
                <span className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                  {iconStyled}
                </span>
              )}

              <Input
                id={inputId}
                {...rest}
                name={fieldName}
                value={value ?? ''}
                onChange={onChange}
                onBlur={onBlur}
                type={inputType}
                placeholder={placeholderComputed}
                autoComplete={autoCompleteComputed}
                inputMode={inputModeComputed}
                spellCheck={spellCheckComputed}
                aria-invalid={Boolean(fieldError)}
                aria-describedby={ariaDescribedBy}
                className={cn(
                  'bg-slate-950/30 text-slate-100 placeholder:text-slate-500',
                  iconComputed && 'pl-10',
                  role === 'password' && 'pr-12',
                  fieldError && 'border-destructive text-destructive placeholder:text-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/40',
                  className,
                )}
              />

              {role === 'password' && (
                <button
                  type='button'
                  onClick={togglePasswordVisibility}
                  className='absolute inset-y-0 right-2 flex items-center rounded-md px-2 text-slate-400 transition hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
                >
                  {isPasswordVisible
                    ? <EyeOff className='h-4 w-4' />
                    : <Eye className='h-4 w-4' />
                  }
                  <span className='sr-only'>{isPasswordVisible ? '隐藏密码' : '显示密码'}</span>
                </button>
              )}
            </div>

            {hint && ! fieldError && (
              <p className={cn('text-xs text-slate-400', hintClassName)}>{hint}</p>
            )}

            {fieldError && (
              <p id={errorId} className='text-xs text-destructive'>
                {fieldError.message?.toString() ?? '请输入有效的值'}
              </p>
            )}
          </div>
        )
      }}
    />
  )
}
