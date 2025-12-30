import { useIsMobile } from '@/hooks/use-mobile'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer'
import { useForm } from 'react-hook-form'
import type { Invite, InviteInput } from '@/types/invite'
import { Button } from './ui/button'
import { InviteForm } from './invite-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tuyau } from '@/main'
import { toast } from 'sonner'
import { useState } from 'react'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { tuyauClient } from '@/lib/tuyau'
import { DropdownMenuItem } from './ui/dropdown-menu'

export function CreateInvite() {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()

  const form = useForm<InviteInput>({
    defaultValues: {
      email: '',
      roleId: '',
    },
  })

  const createInviteMutation = useMutation(
    tuyau.api.invites.$post.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: tuyau.api.invites.$get.pathKey(),
        })
        setOpen((prev) => !prev)
      },
    }),
  )

  const onSubmit = async (payload: InviteInput) => {
    toast.promise(
      async () => await createInviteMutation.mutateAsync({ payload }),
      {
        loading: 'Creating invite...',
        success: () => `Created successfully`,
        error: () => 'Failed to create invite',
      },
    )
  }

  return (
    <Drawer
      open={open}
      direction={isMobile ? 'bottom' : 'right'}
      onOpenChange={() =>
        form.reset({
          email: '',
          roleId: '',
        })
      }
    >
      <DrawerTrigger asChild onClick={() => setOpen((prev) => !prev)}>
        <Button variant="default">New invite</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>New Invite</DrawerTitle>
          <DrawerDescription>Invite personal information</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <InviteForm form={form} onSubmit={onSubmit} />
        </div>
        <DrawerFooter>
          <Button type="submit" form="invite-form">
            Create
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export function EditInvite({
  invite,
  open,
  onCallback,
  onToggleOpen,
}: {
  invite: Invite
  open: boolean
  onToggleOpen: () => void
  onCallback?: () => void
}) {
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const form = useForm<InviteInput>({
    defaultValues: {
      email: invite.email,
      roleId: invite.roleId,
    },
  })

  const updateInviteMutation = useMutation(
    tuyau.api.invites({ id: invite.id }).$put.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: tuyau.api.invites.$get.pathKey(),
        })
        if (onCallback) {
          onCallback()
        }
      },
    }),
  )

  const onSubmit = async (payload: InviteInput) => {
    toast.promise(
      async () => await updateInviteMutation.mutateAsync({ payload }),
      {
        loading: 'Updating invite...',
        success: () => `Updated successfully`,
        error: () => 'Failed to update invite',
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
          <DrawerTitle>Edit Invite</DrawerTitle>
          <DrawerDescription>Invite personal information</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <InviteForm form={form} onSubmit={onSubmit} />
        </div>
        <DrawerFooter>
          <Button type="submit" form="invite-form">
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

export function CopyInviteLinkAction({ inviteId }: { inviteId: string }) {
  const { copyToClipboard } = useCopyToClipboard()

  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await tuyauClient.api
        .invites({ id: inviteId })
        .generate.$get()
      if (!response.data?.link) throw new Error('No link generated')
      return response.data.link
    },
    onSuccess: (link) => {
      copyToClipboard(link)
      toast.success('Link copied to clipboard')
    },
    onError: () => {
      toast.error('Failed to generate invite link')
    },
  })

  return (
    <DropdownMenuItem
      disabled={generateLinkMutation.isPending}
      onSelect={(e) => {
        e.preventDefault()
        generateLinkMutation.mutate()
      }}
    >
      {generateLinkMutation.isPending ? 'Generating...' : 'Copy Link'}
    </DropdownMenuItem>
  )
}
