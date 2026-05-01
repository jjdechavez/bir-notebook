import { useForm } from "@tanstack/react-form"
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router"
import { GalleryVerticalEnd, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { z } from "zod"
import { PublicNotFound } from "@/components/public-not-found"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field"
import { Input, PasswordInput } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/lib/api"
import { authClient } from "@/lib/auth-client"

const schema = z.object({
	email: z.email(),
	password: z.string(),
})

export const Route = createFileRoute("/(public)/login")({
	validateSearch: z.object({
		redirect: z.string().optional(),
		setup: z.string().optional(),
	}),
	beforeLoad: async ({ context }) => {
		if (context.auth.isLoading) {
			return
		}

		if (context.auth.isAuthenticated) {
			throw redirect({
				to: "/dashboard",
			})
		}

		const needsSetup = await api.systems
			.systemSetupStatus()
			.then((res) => {
				return res.setup === "pending"
			})
			.catch(() => false)

		if (needsSetup) {
			throw redirect({
				to: "/setup",
			})
		}
	},
	pendingComponent: () => (
		<div className="flex min-h-svh w-full items-center justify-center">
			<Spinner />
		</div>
	),
	component: LoginComponent,
	notFoundComponent: PublicNotFound,
})

function LoginComponent() {
	const navigate = useNavigate()
	const { setup } = Route.useSearch()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [loginError, setLoginError] = useState<string | null>(null)

	const session = authClient.useSession()

	useEffect(() => {
		if (session.data?.session && isSubmitting) {
			setIsSubmitting(false)
			navigate({ to: "/dashboard" })
		}
	}, [session.data, isSubmitting, navigate])

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		} as z.infer<typeof schema>,
		validators: {
			onChange: schema,
			onSubmit: schema,
			onBlur: schema,
		},
		onSubmit: async ({ value }) => {
			setIsSubmitting(true)
			setLoginError(null)
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onError: (ctx) => {
						setIsSubmitting(false)
						setLoginError(ctx.error.message)
					},
				},
			)
		},
	})

	return (
		<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm">
				<div className="flex flex-col gap-6">
					<form
						id="login-form"
						onSubmit={(e) => {
							e.preventDefault()
							e.stopPropagation()
							form.handleSubmit()
						}}
					>
						<FieldGroup>
							<div className="flex flex-col items-center gap-2 text-center">
								<Link
									to="/"
									className="flex flex-col items-center gap-2 font-medium"
								>
									<div className="flex size-8 items-center justify-center rounded-md">
										<GalleryVerticalEnd className="size-6" />
									</div>
									<span className="sr-only">BIR Notebook</span>
								</Link>
								<h1 className="text-xl font-bold">Welcome to BIR Notebook</h1>
								{setup === "success" && (
									<Alert variant="success">
										<AlertDescription>
											Admin account created successfully. Please login with your
											credentials.
										</AlertDescription>
									</Alert>
								)}
								{loginError && (
									<Alert variant="destructive">
										<AlertDescription>{loginError}</AlertDescription>
									</Alert>
								)}
							</div>
							<form.Field name="email">
								{(field) => (
									<Field data-invalid={field.state.meta.errors.length > 0}>
										<FieldLabel htmlFor={field.name}>Email</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="email"
											placeholder="m@example.com"
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
										<div className="flex items-center">
											<FieldLabel htmlFor={field.name}>Password</FieldLabel>
											<Link
												to="/"
												className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
											>
												Forgot your password?
											</Link>
										</div>
										<PasswordInput
											id={field.name}
											name={field.name}
											type="password"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
										/>
										{field.state.meta.errors.length > 0 && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								)}
							</form.Field>
							<Field>
								<Button type="submit" form="login-form" disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<Loader2 className="size-4 animate-spin" />
											Logging in...
										</>
									) : (
										"Login"
									)}
								</Button>
							</Field>
						</FieldGroup>
					</form>
				</div>
			</div>
		</div>
	)
}
