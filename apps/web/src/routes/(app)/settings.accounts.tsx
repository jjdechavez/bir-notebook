import { ChangePasswordForm } from '@/components/account-change-password-form'
import { PersonalInformationForm } from '@/components/personal-information-form'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { tuyau } from '@/main'
import type {
  ChangePasswordInput,
  PersonalInformationInput,
} from '@/types/account'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { TuyauHTTPError } from '@tuyau/client'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export const Route = createFileRoute('/(app)/settings/accounts')({
  loader: () => {
    return {
      crumb: 'Accounts',
    }
  },
  component: AccountsSetting,
})

function AccountsSetting() {
  return (
    <div className="px-12 lg:px-8">
      <h1 className="font-bold text-xl text-foreground">Accounts</h1>

      <div className="divide-y divide-gray-200 dark:divide-white/10">
        <PersonalInformation />

        <ChangePassword />

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 py-16 md:grid-cols-3">
          <div>
            <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">
              Log out other sessions
            </h2>
            <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">
              Please enter your password to confirm you would like to log out of
              your other sessions across all of your devices.
            </p>
          </div>

          <form className="md:col-span-2">
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
              <div className="col-span-full">
                <label
                  htmlFor="logout-password"
                  className="block text-sm/6 font-medium text-gray-900 dark:text-white"
                >
                  Your password
                </label>
                <div className="mt-2">
                  <input
                    id="logout-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex">
              <Button type="submit">Log out other sessions</Button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 py-16 md:grid-cols-3">
          <div>
            <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">
              Delete account
            </h2>
            <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">
              No longer want to use our service? You can delete your account
              here. This action is not reversible. All information related to
              this account will be deleted permanently.
            </p>
          </div>

          <form className="flex items-start md:col-span-2">
            <Button type="submit" variant="destructive">
              Yes, delete my account
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

function PersonalInformation() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const form = useForm<PersonalInformationInput>({
    defaultValues: {
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
    },
  })

  const updatePersonalInformationMutation = useMutation(
    tuyau.api.accounts.$put.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            tuyau.api.session.$get.pathKey(),
            tuyau.api.users.$get.pathKey(),
          ],
        })
      },
    }),
  )

  const onSubmit = async (payload: PersonalInformationInput) => {
    toast.promise(
      async () =>
        await updatePersonalInformationMutation.mutateAsync({ payload }),
      {
        loading: 'Updating personal information...',
        success: () => `Personal information updated successfully`,
        error: () => 'Failed to update personal information',
      },
    )
  }

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-10 py-16 md:grid-cols-3">
      <div>
        <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">
          Personal Information
        </h2>
        <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">
          Use a permanent address where you can receive mail.
        </p>
      </div>

      <PersonalInformationForm
        className="md:col-span-2"
        form={form}
        onSubmit={onSubmit}
      />

      <div className="mt-8 flex md:col-start-2">
        <Button type="submit" form="personal-information-form">
          Save
        </Button>
      </div>
    </div>
  )
}

function ChangePassword() {
  const form = useForm<ChangePasswordInput>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      new_password_confirmation: '',
    },
  })

  const changePasswordMutation = useMutation(
    tuyau.api.accounts.passwords.$post.mutationOptions({
      onError: (e) => {
        if (e instanceof TuyauHTTPError) {
          const value = e.value as {
            errors: Array<{
              message: string
              field: string
              meta?: { otherField: string }
            }>
          }
          value.errors.forEach((err) => {
            form.setError(err.field, { message: err.message })
            if (err.meta?.otherField) {
              form.setError(err.meta.otherField, {
                message: 'New password and confirm password must be the same',
              })
            }
          })
        }
      },
    }),
  )

  const onSubmit = async (payload: ChangePasswordInput) => {
    toast.promise(
      async () => await changePasswordMutation.mutateAsync({ payload }),
      {
        loading: 'Updating password...',
        success: () => `Password updated successfully`,
        error: () => 'Failed to update password',
      },
    )
  }

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-10 py-16 md:grid-cols-3">
      <div>
        <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">
          Change password
        </h2>
        <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">
          Update your password associated with your account.
        </p>
      </div>

      <ChangePasswordForm
        form={form}
        onSubmit={onSubmit}
        className="md:col-span-2"
      />

      <div className="mt-8 flex md:col-start-2">
        <Button type="submit" form="change-password-form">
          Save
        </Button>
      </div>
    </div>
  )
}
