import {
  createFormHook,
  createFormHookContexts,
  formOptions,
} from '@tanstack/react-form'
import { Field, FieldError, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import { SimpleSelectRole } from './simple-select-role'
import type { UserRole } from '@bir-notebook/shared/models/user'
import { newInviteInputSchema } from '@bir-notebook/shared/models/invite'

const { fieldContext, formContext } = createFormHookContexts()
const { useAppForm: useInviteAppForm, withForm } = createFormHook({
  fieldComponents: {},
  formComponents: {},
  fieldContext,
  formContext,
})

export { useInviteAppForm }

export const inviteAppFormOpts = formOptions({
  defaultValues: {
    email: '',
    role: 'user' as UserRole,
  },
  validators: {
    onSubmit: newInviteInputSchema,
  },
})

export const InviteForm = withForm({
  ...inviteAppFormOpts,
  render: ({ form }) => {
    return (
      <form
        id="invite-form"
        className="space-y-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <form.Field
          name="role"
          children={(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Role</FieldLabel>
              <SimpleSelectRole
                name={field.name}
                value={field.state.value}
                handleChange={(role) => {
                  field.handleChange(role as UserRole)
                }}
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
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type="email"
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
      </form>
    )
  },
})
