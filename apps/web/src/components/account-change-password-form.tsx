import { Field, FieldError, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import {
  createFormHook,
  createFormHookContexts,
  formOptions,
} from '@tanstack/react-form'
import { cn } from '@/lib/utils'

const { fieldContext, formContext } = createFormHookContexts()

const { useAppForm: useChangePasswordAppForm, withForm } = createFormHook({
  fieldComponents: {},
  formComponents: {},
  fieldContext,
  formContext,
})

export { useChangePasswordAppForm }

export const changePasswordAppFormOpts = formOptions({
  defaultValues: {
    currentPassword: '',
    newPassword: '',
    newPassword_confirmation: '',
  },
  validators: {},
})

export const ChangePasswordForm = withForm({
  ...changePasswordAppFormOpts,
  props: {
    className: '',
  },
  render: ({ form, className }) => {
    return (
      <form
        id="change-password-form"
        className={cn(className)}
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
          <form.Field
            name="currentPassword"
            children={(field) => (
              <Field
                data-invalid={field.state.meta.errors.length > 0}
                className="col-span-full"
              >
                <FieldLabel htmlFor={field.name}>Current password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
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
            name="newPassword"
            children={(field) => (
              <Field
                data-invalid={field.state.meta.errors.length > 0}
                className="col-span-full"
              >
                <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
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
            name="newPassword_confirmation"
            children={(field) => (
              <Field
                data-invalid={field.state.meta.errors.length > 0}
                className="col-span-full"
              >
                <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value as string}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
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
