import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from "@tanstack/react-form"
import { Field, FieldError, FieldLabel } from "./ui/field"
import { Input } from "./ui/input"
import { SimpleSelectRole } from "./simple-select-role"
import { userInputSchema } from "@/types/user"
import type { UserRole } from "@bir-notebook/shared/models/user"

const { fieldContext, formContext } = createFormHookContexts()
const { useAppForm: useUserAppForm, withForm } = createFormHook({
	fieldComponents: {},
	formComponents: {},
	fieldContext,
	formContext,
})

export { useUserAppForm }

export const userAppFormOpts = formOptions({
	defaultValues: {
		firstName: "",
		lastName: "",
		role: "user" as UserRole,
	},
	validators: {
		onSubmit: userInputSchema,
	},
})

export const UserForm = withForm({
	...userAppFormOpts,
	render: ({ form }) => {
		return (
			<form
				id="user-form"
				className="space-y-4"
				onSubmit={(e) => {
					e.preventDefault()
				}}
			>
				<form.Field
					name="firstName"
					children={(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>First Name</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value}
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
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value}
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
					name="role"
					children={(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>Role</FieldLabel>
							<SimpleSelectRole
								name={field.name}
								handleChange={(e) => field.handleChange(e as UserRole)}
								value={field.state.value}
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
