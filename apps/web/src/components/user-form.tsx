import { Controller, type UseFormReturn } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import type { UserInput } from '@/types/user'
import { SelectRole } from './select-role'

type UserFormProps = {
  onSubmit: (input: UserInput) => void
  form: UseFormReturn<UserInput>
}

export function UserForm(props: UserFormProps) {
  const onSubmit = props.form.handleSubmit((payload) => {
    props.onSubmit(payload)
  })

  return (
    <form id="user-form" onSubmit={onSubmit} className='space-y-4'>
      <Controller
        control={props.form.control}
        name="firstName"
        render={({ field, fieldState, formState }) => {
          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>First Name</FieldLabel>
              <Input
                {...field}
                value={field.value ?? ''}
                disabled={formState.isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )
        }}
      />

      <Controller
        control={props.form.control}
        name="lastName"
        render={({ field, fieldState, formState }) => {
          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
              <Input
                {...field}
                value={field.value ?? ''}
                disabled={formState.isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )
        }}
      />

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
    </form>
  )
}
