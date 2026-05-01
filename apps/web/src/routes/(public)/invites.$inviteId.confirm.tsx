import { inviteCompleteInputSchema } from "@bir-notebook/shared/models/invite"
import { useForm } from "@tanstack/react-form"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { GalleryVerticalEnd } from "lucide-react"
import { toast } from "sonner"
import PublicLayout from "@/components/public-layout"
import { PublicNotFound } from "@/components/public-not-found"
import { Button } from "@/components/ui/button"
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field"
import { Input, PasswordInput } from "@/components/ui/input"
import { inviteOptions, useCompleteInvite } from "@/hooks/api/invite"
import type { Invite } from "@/types/invite"

export const Route = createFileRoute("/(public)/invites/$inviteId/confirm")({
	loader: ({ context, params }) => {
		return {
			...context.queryClient.ensureQueryData(inviteOptions(params.inviteId)),
		}
	},
	component: InviteConfrim,
	notFoundComponent: PublicNotFound,
})

function InviteConfrim() {
	const { inviteId } = Route.useParams()
	const { data } = useSuspenseQuery(inviteOptions(inviteId))

	if (!data || data.status === "accepted") {
		return <PublicNotFound />
	}

	return <AccountForm invite={data} />
}

function CreatedAccount() {
	return (
		<PublicLayout>
			<Link to="/" className="flex flex-col items-center gap-2 font-medium">
				<div className="flex size-8 items-center justify-center rounded-md">
					<GalleryVerticalEnd className="size-6" />
				</div>
				<span className="sr-only">BIR Notebook</span>
			</Link>
			<h1 className="text-xl font-bold">
				Your account has been successfully set up
			</h1>
			<FieldDescription>
				You can now login to your account <Link to="/login">here</Link>.
			</FieldDescription>
		</PublicLayout>
	)
}

function AccountForm({ invite }: { invite: Invite }) {
	const form = useForm({
		defaultValues: {
			firstName: "",
			lastName: "",
			password: "",
			password_confirmation: "",
		},
		validators: {
			onSubmit: inviteCompleteInputSchema,
		},
		onSubmit: async ({ value }) => {
			toast.promise(() => mutation.mutateAsync(value), {
				loading: "Creating an account...",
				success: "Account created successfully!",
				error: "Failed to create account",
			})
		},
	})

	const mutation = useCompleteInvite(invite.id.toString(), {
		onError: (err) => {
			const errors = err.data?.data || []

			errors.forEach((error: { field: string; message: string }) => {
				form.setErrorMap({
					onSubmit: {
						fields: { [error.field]: { onSubmit: error.message } },
					},
				})
			})
		},
	})

	if (mutation.status === "success") {
		return <CreatedAccount />
	}

	return (
		<PublicLayout>
			<form
				id="complete-form"
				onSubmit={(e) => {
					e.preventDefault()
					form.handleSubmit()
				}}
			>
				<FieldGroup>
					<div className="flex flex-col items-center gap-2 text-center">
						<Link
							to="/login"
							className="flex flex-col items-center gap-2 font-medium"
						>
							<div className="flex size-8 items-center justify-center rounded-md">
								<GalleryVerticalEnd className="size-6" />
							</div>
							<span className="sr-only">BIR Notebook</span>
						</Link>
						<h1 className="text-xl font-bold">Setup your account.</h1>
					</div>

					<Field aria-disabled={true}>
						<FieldLabel htmlFor="email">Email</FieldLabel>
						<Input
							id="email"
							value={invite.email}
							placeholder="John"
							autoComplete="false"
							disabled
						/>
					</Field>

					<form.Field name="firstName">
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>First Name</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									placeholder="John"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									aria-invalid={field.state.meta.errors.length > 0}
									autoComplete="false"
								/>
								{field.state.meta.errors.length > 0 && (
									<FieldError errors={field.state.meta.errors} />
								)}
							</Field>
						)}
					</form.Field>

					<form.Field name="lastName">
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									placeholder="Doe"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									aria-invalid={field.state.meta.errors.length > 0}
									autoComplete="false"
								/>
								{field.state.meta.errors.length > 0 && (
									<FieldError errors={field.state.meta.errors} />
								)}
							</Field>
						)}
					</form.Field>

					<form.Field name="password">
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>Password</FieldLabel>
								<PasswordInput
									id={field.name}
									name={field.name}
									type="password"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									aria-invalid={field.state.meta.errors.length > 0}
									autoComplete="false"
								/>
								{field.state.meta.errors.length > 0 && (
									<FieldError errors={field.state.meta.errors} />
								)}
							</Field>
						)}
					</form.Field>

					<form.Field name="password_confirmation">
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>
									Password Confirmation
								</FieldLabel>
								<PasswordInput
									id={field.name}
									name={field.name}
									type="password"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									aria-invalid={field.state.meta.errors.length > 0}
									autoComplete="false"
								/>
								{field.state.meta.errors.length > 0 && (
									<FieldError errors={field.state.meta.errors} />
								)}
							</Field>
						)}
					</form.Field>

					<Field>
						<Button type="submit" form="complete-form">
							Create account
						</Button>
					</Field>
				</FieldGroup>
			</form>
		</PublicLayout>
	)
}
