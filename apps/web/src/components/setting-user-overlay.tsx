import { useForm } from 'react-hook-form'
import { Button } from './ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from './ui/drawer'
import { UserForm } from './user-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { User, UserInput } from '@/types/user'
import { useIsMobile } from '@/hooks/use-mobile'
import { tuyau } from '@/main'
import { toast } from 'sonner'

export function EditUser({
  user,
  open,
  onCallback,
  onToggleOpen,
}: {
  user: User
  open: boolean
  onToggleOpen: () => void
  onCallback?: () => void
}) {
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const form = useForm<UserInput>({
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
    },
  })

  const updateUserMutation = useMutation(
    tuyau.api.users({ id: user.id }).$put.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: tuyau.api.users.$get.pathKey(),
        })
        if (onCallback) {
          onCallback()
        }
      },
    }),
  )

  const onSubmit = async (payload: UserInput) => {
    toast.promise(
      async () => await updateUserMutation.mutateAsync({ payload }),
      {
        loading: 'Updating user...',
        success: () => `Updated successfully`,
        error: () => 'Failed to update user',
      },
    )
  }

  return (
    <Drawer
      open={open}
      direction={isMobile ? 'bottom' : 'right'}
      onOpenChange={(isOpen) => !isOpen && onToggleOpen()}
    >
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Edit User</DrawerTitle>
          <DrawerDescription>User personal information</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <UserForm form={form} onSubmit={onSubmit} />
        </div>
        <DrawerFooter>
          <Button type="submit" form="user-form">
            Update
          </Button>
          <DrawerClose asChild onClick={onToggleOpen}>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
