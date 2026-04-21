import {
  createFormHook,
  createFormHookContexts,
  formOptions,
} from '@tanstack/react-form'
import { Field, FieldError, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import { cn } from '@/lib/utils'

const { fieldContext, formContext } = createFormHookContexts()

const { useAppForm: usePersonalInformationAppForm, withForm } = createFormHook({
  fieldComponents: {},
  formComponents: {},
  fieldContext,
  formContext,
})

export { usePersonalInformationAppForm }

export const personalInformationAppFormOpts = formOptions({
  defaultValues: {
    firstName: '',
    lastName: '',
    email: '',
  },
  validators: {},
})

export const PersonalInformationForm = withForm({
  ...personalInformationAppFormOpts,
  props: {
    className: '',
  },
  render: ({ form, className }) => {
    return (
      <form
        id="personal-information-form"
        className={cn(className)}
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
          <form.Field
            name="firstName"
            children={(field) => (
              <Field
                data-invalid={field.state.meta.errors.length > 0}
                className="sm:col-span-3"
              >
                <FieldLabel htmlFor={field.name}>First Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value as string}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  disabled={form.state.isSubmitting}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                {field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )}
          />

          <form.Field
            name="lastName"
            children={(field) => (
              <Field
                data-invalid={field.state.meta.errors.length > 0}
                className="sm:col-span-3"
              >
                <FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value as string}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  disabled={form.state.isSubmitting}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                {field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )}
          />

          <form.Field
            name="email"
            children={(field) => (
              <Field
                data-invalid={field.state.meta.errors.length > 0}
                className="col-span-full"
              >
                <FieldLabel htmlFor={field.name}>Email address</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value as string}
                  disabled={true}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                {field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )}
          />
        </div>
      </form>
    )
  },
})
