import { Controller, type UseFormReturn } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import type { ChangePasswordInput } from '@/types/account'
import { cn } from '@/lib/utils'

type ChangePasswordFormProps = {
  onSubmit: (input: ChangePasswordInput) => void
  form: UseFormReturn<ChangePasswordInput>
  className?: string
}

export function ChangePasswordForm(props: ChangePasswordFormProps) {
  const onSubmit = props.form.handleSubmit((payload) => {
    props.onSubmit(payload)
  })

  return (
    <form
      id="change-password-form"
      onSubmit={onSubmit}
      className={cn(props.className)}
    >
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
        <Controller
          control={props.form.control}
          name="currentPassword"
          render={({ field, fieldState, formState }) => {
            return (
              <Field
                data-invalid={fieldState.invalid}
                className="col-span-full"
              >
                <FieldLabel htmlFor={field.name}>Current password</FieldLabel>
                <Input
                  {...field}
                  type="password"
                  value={field.value ?? ''}
                  disabled={formState.isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )
          }}
        />

        <Controller
          control={props.form.control}
          name="newPassword"
          render={({ field, fieldState, formState }) => {
            return (
              <Field
                data-invalid={fieldState.invalid}
                className="col-span-full"
              >
                <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                <Input
                  {...field}
                  type='password'
                  value={field.value ?? ''}
                  disabled={formState.isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )
          }}
        />

        <Controller
          control={props.form.control}
          name="newPassword_confirmation"
          render={({ field, fieldState }) => {
            return (
              <Field
                data-invalid={fieldState.invalid}
                className="col-span-full"
              >
                <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
                <Input
                  {...field}
                  type='password'
                  value={field.value ?? ''}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )
          }}
        />
      </div>
    </form>
  )
}
