'use client'

import { ReactNode } from 'react'
import {
  Controller,
  RegisterOptions,
  useFormContext,
  type FieldValues,
} from 'react-hook-form'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/comps/ui/select'
import { cn } from '@/lib/utils'

type GenericFieldValues = FieldValues & Record<string, unknown>

export interface SelectOption {
  label: string
  value: string
}

export interface SelectFieldProps {
  name: string
  label: ReactNode
  options: SelectOption[]
  description?: ReactNode
  placeholder?: string
  hint?: ReactNode
  rules?: RegisterOptions<GenericFieldValues>
  valueType?: 'string' | 'number'
  containerClassName?: string
  labelClassName?: string
  descriptionClassName?: string
  hintClassName?: string
  className?: string
  id?: string
}

export function SelectField({
  name,
  label,
  options,
  description,
  placeholder,
  hint,
  rules,
  valueType = 'string',
  containerClassName,
  labelClassName,
  descriptionClassName,
  hintClassName,
  className,
  id,
}: SelectFieldProps) {
  const { control } = useFormContext<GenericFieldValues>()

  const inputId = id ?? name
  const descriptionId = description ? `${inputId}-description` : undefined

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const { value, onChange } = field
        const fieldError = fieldState.error
        const errorId = fieldError ? `${inputId}-error` : undefined

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

            <Select
              onValueChange={(val) => {
                if (valueType === 'number') onChange(Number(val))
                else onChange(val)
              }}
              defaultValue={value?.toString()}
              value={value?.toString()}
            >
              <SelectTrigger
                id={inputId}
                className={cn(
                  'w-full bg-slate-950/30 text-slate-100',
                  fieldError && 'border-destructive text-destructive focus-visible:ring-destructive/40',
                  className
                )}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hint && ! fieldError && (
              <p className={cn('text-xs text-slate-400', hintClassName)}>{hint}</p>
            )}

            {fieldError && (
              <p id={errorId} className='text-xs text-destructive'>
                {fieldError.message?.toString() ?? '请选择有效的值'}
              </p>
            )}
          </div>
        )
      }}
    />
  )
}
