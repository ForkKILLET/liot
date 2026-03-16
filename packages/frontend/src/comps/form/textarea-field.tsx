'use client'

import { ReactNode } from 'react'
import {
  Controller,
  RegisterOptions,
  useFormContext,
  type FieldValues,
} from 'react-hook-form'

import { Textarea } from '@/comps/ui/textarea'
import { cn } from '@/lib/utils'

type GenericFieldValues = FieldValues & Record<string, unknown>

type TextareaProps = React.ComponentProps<typeof Textarea>

export interface TextareaFieldProps extends Omit<TextareaProps, 'name' | 'defaultValue'> {
  name: string
  label: ReactNode
  description?: ReactNode
  hint?: ReactNode
  rules?: RegisterOptions<GenericFieldValues>
  containerClassName?: string
  labelClassName?: string
  descriptionClassName?: string
  hintClassName?: string
}

export function TextareaField({
  name,
  label,
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
  ...rest
}: TextareaFieldProps) {
  const { control } = useFormContext<GenericFieldValues>()

  const inputId = id ?? name
  const descriptionId = description ? `${inputId}-description` : undefined

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const { value, onChange, onBlur, name: fieldName } = field
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

            <Textarea
              id={inputId}
              {...rest}
              name={fieldName}
              value={value ?? ''}
              onChange={onChange}
              onBlur={onBlur}
              placeholder={placeholder}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={ariaDescribedBy}
              className={cn(
                'bg-slate-950/30 text-slate-100 placeholder:text-slate-500',
                fieldError && 'border-destructive text-destructive placeholder:text-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/40',
                className,
              )}
            />

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
