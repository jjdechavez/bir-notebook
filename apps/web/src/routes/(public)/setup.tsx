import PublicLayout from '@/components/public-layout'
import { PublicNotFound } from '@/components/public-not-found'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { GalleryVerticalEnd } from 'lucide-react'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { authClient } from '@/lib/auth-client'
import { api } from '@/lib/api'

const schema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

type SetupInput = z.infer<typeof schema>

export const Route = createFileRoute('/(public)/setup')({
  beforeLoad: async () => {
    const data = await api.systems.systemSetupStatus()

    if (data.setup === 'completed') {
      throw redirect({ to: '/login' })
    }
  },
  component: SetupPage,
  notFoundComponent: PublicNotFound,
})

function SetupPage() {
  const navigate = useNavigate()
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      password_confirmation: '',
    } as SetupInput,
    validators: {
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      toast.promise(
        async () => {
          await authClient.signUp.email(
            {
              email: value.email,
              password: value.password,
              name: `${value.firstName} ${value.lastName}`,
              firstName: value.firstName,
              lastName: value.lastName,
              callbackURL: '/login?setup=success',
            },
            {
              onSuccess: () => {
                setIsSuccess(true)
                navigate({ to: '/login', search: { setup: 'success' } })
              },
            },
          )
        },

        {
          loading: 'Creating admin account...',
          success: 'Admin account created!',
          error: 'Failed to create admin account',
        },
      )
    },
  })

  if (isSuccess) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center gap-4 text-center">
          <a href="#" className="flex flex-col items-center gap-2 font-medium">
            <div className="flex size-8 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-6" />
            </div>
            <span className="sr-only">BIR Notebook</span>
          </a>
          <h1 className="text-xl font-bold">Setup Complete</h1>
          <FieldDescription>
            Your admin account has been created. Redirecting you to login...
          </FieldDescription>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <form
        id="setup-form"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">BIR Notebook</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to BIR Notebook</h1>
            <FieldDescription>
              Create your admin account to get started
            </FieldDescription>
          </div>

          <form.Field
            name="firstName"
            children={(field) => (
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
                  autoComplete="given-name"
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
                  placeholder="Doe"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={field.state.meta.errors.length > 0}
                  autoComplete="family-name"
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
                  placeholder="admin@example.com"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={field.state.meta.errors.length > 0}
                  autoComplete="email"
                />
                {field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )}
          />

          <form.Field
            name="password"
            children={(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={field.state.meta.errors.length > 0}
                  autoComplete="new-password"
                />
                {field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )}
          />

          <form.Field
            name="password_confirmation"
            children={(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={field.state.meta.errors.length > 0}
                  autoComplete="new-password"
                />
                {field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )}
          />

          <Field>
            <Button type="submit" form="setup-form">
              Create Admin Account
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </PublicLayout>
  )
}
