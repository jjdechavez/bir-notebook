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
import { tuyau } from '@/main'
import type { Invite, InviteCompleteInput } from '@/types/invite'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { TuyauHTTPError } from '@tuyau/client'
import { GalleryVerticalEnd } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

export const Route = createFileRoute('/(public)/invites/$inviteId/confirm')({
  component: InviteConfrim,
  notFoundComponent: PublicNotFound,
})

function InviteConfrim() {
  const { inviteId } = Route.useParams()
  const { status, data } = useQuery(
    tuyau.api.invites({ id: inviteId }).$get.queryOptions(),
  )

  if (status === 'pending') {
    return <div>Loading</div>
  }

  if (!data || data.status === 'accepted') {
    return <PublicNotFound />
  }

  return <AccountForm invite={data} />
}

function CreatedAccount() {
  return (
    <PublicLayout>
      <a href="#" className="flex flex-col items-center gap-2 font-medium">
        <div className="flex size-8 items-center justify-center rounded-md">
          <GalleryVerticalEnd className="size-6" />
        </div>
        <span className="sr-only">Acme Inc.</span>
      </a>
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
  const queryClient = useQueryClient()
  const form = useForm<InviteCompleteInput>({
    defaultValues: {
      firstName: '',
      lastName: '',
      password: '',
      password_confirmation: '',
    },
  })

  const mutation = useMutation(
    tuyau.api.invites({ id: invite.id }).complete.$post.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: tuyau.api.invites.$get.pathKey(),
        })
      },
      onError(error) {
        if (error instanceof TuyauHTTPError) {
          error.value.errors.forEach(
            (error: {
              message: string
              rule: string
              field: string
              meta?: { otherField: string }
            }) => {
              form.setError(error.field as keyof InviteCompleteInput, {
                message: error.message,
              })
              if (error.meta?.otherField) {
                form.setError(
                  error.meta.otherField as keyof InviteCompleteInput,
                  {
                    message: error.message,
                  },
                )
              }
            },
          )
        }
      },
    }),
  )

  const onSubmit = async (payload: InviteCompleteInput) => {
    toast.promise(() => mutation.mutateAsync({ payload }), {
      loading: 'Creating an account...',
      success: 'Account created successfully!',
      error: 'Failed to create account',
    })
  }

  if (mutation.status === 'success') {
    return <CreatedAccount />
  }

  return (
    <PublicLayout>
      <form id="complete-form" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Acme Inc.</span>
            </a>
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

          <Controller
            name="firstName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>First Name</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="John"
                  aria-invalid={fieldState.invalid}
                  autoComplete="false"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="lastName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Doe"
                  aria-invalid={fieldState.invalid}
                  autoComplete="false"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field aria-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="password"
                  aria-invalid={fieldState.invalid}
                  autoComplete="false"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="password_confirmation"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field aria-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Password Confirmation
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="password"
                  aria-invalid={fieldState.invalid}
                  autoComplete="false"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
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
