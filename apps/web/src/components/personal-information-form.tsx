import { Controller, type UseFormReturn } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import type { PersonalInformationInput } from '@/types/account'
import { cn } from '@/lib/utils'

type PersonalInformationFormProps = {
  onSubmit: (input: PersonalInformationInput) => void
  form: UseFormReturn<PersonalInformationInput>
  className?: string
}

export function PersonalInformationForm(props: PersonalInformationFormProps) {
  const onSubmit = props.form.handleSubmit((payload) => {
    props.onSubmit(payload)
  })

  return (
    <form
      id="personal-information-form"
      onSubmit={onSubmit}
      className={cn(props.className)}
    >
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
        <Controller
          control={props.form.control}
          name="firstName"
          render={({ field, fieldState, formState }) => {
            return (
              <Field
                data-invalid={fieldState.invalid}
                className="sm:col-span-3"
              >
                <FieldLabel htmlFor={field.name}>First Name</FieldLabel>
                <Input
                  {...field}
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
          name="lastName"
          render={({ field, fieldState, formState }) => {
            return (
              <Field
                data-invalid={fieldState.invalid}
                className="sm:col-span-3"
              >
                <FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
                <Input
                  {...field}
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
          name="email"
          render={({ field, fieldState }) => {
            return (
              <Field
                data-invalid={fieldState.invalid}
                className="col-span-full"
              >
                <FieldLabel htmlFor={field.name}>Email address</FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  disabled={true}
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
