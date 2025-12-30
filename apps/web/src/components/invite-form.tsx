import { Controller, type UseFormReturn } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import type { InviteInput } from '@/types/invite'
import { SelectRole } from './select-role'

type InviteFormProps = {
  onSubmit: (input: InviteInput) => void
  form: UseFormReturn<InviteInput>
}

export function InviteForm(props: InviteFormProps) {
  const onSubmit = props.form.handleSubmit((payload) => {
    props.onSubmit(payload)
  })

  return (
    <form id="invite-form" onSubmit={onSubmit} className="space-y-4">
      <Controller
        control={props.form.control}
        name="roleId"
        render={({ field, fieldState }) => {
          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Role</FieldLabel>
              <SelectRole
                {...field}
                value={field.value as number}
                onChange={(role) => {
                  field.onChange(role!.id)
                }}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )
        }}
      />
      <Controller
        control={props.form.control}
        name="email"
        render={({ field, fieldState, formState }) => {
          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                {...field}
                type="email"
                value={field.value ?? ''}
                disabled={formState.isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )
        }}
      />
    </form>
  )
}
