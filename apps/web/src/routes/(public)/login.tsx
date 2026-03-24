import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { PublicNotFound } from '@/components/public-not-found'
import { useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { GalleryVerticalEnd } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { useAuth } from '../../lib/auth'
import { api } from '@/lib/api'

const schema = z.object({
  email: z.email(),
  password: z.string(),
})

export const Route = createFileRoute('/(public)/login')({
  validateSearch: z.object({
    redirect: z.string().optional(),
    setup: z.string().optional(),
  }),
  beforeLoad: async ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: '/dashboard',
      })
    }

    const needsSetup = await api.systems
      .systemSetupStatus()
      .then((res) => {
        console.log(res)
        return res.setup === 'pending'
      })
      .catch(() => false)

    if (needsSetup) {
      throw redirect({
        to: '/setup',
      })
    }
  },
  component: LoginComponent,
  notFoundComponent: PublicNotFound,
})

function LoginComponent() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const { setup } = Route.useSearch()

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    } as z.infer<typeof schema>,
    validators: {
      onChange: schema,
      onSubmit: schema,
      onBlur: schema,
    },
    onSubmit: async ({ value }) => {
      try {
        await login(value.email, value.password)
      } catch (err) {
        throw err
      }
    },
  })

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          {setup === 'success' && (
            <Alert className="border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200">
              <AlertDescription>
                Admin account created successfully. Please login with your
                credentials.
              </AlertDescription>
            </Alert>
          )}
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
              </div>
              <form.Field
                name="email"
                children={(field) => (
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
              />
              <form.Field
                name="password"
                children={(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <div className="flex items-center">
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <a
                        href="#"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <Input
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
              />
              <Field>
                <Button type="submit" form="login-form">
                  Login
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </div>
      </div>
    </div>
  )
}
