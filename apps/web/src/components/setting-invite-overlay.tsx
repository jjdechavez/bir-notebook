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
import type { Invite } from '@/types/invite'
import { Button } from './ui/button'
import { inviteAppFormOpts, InviteForm, useInviteAppForm } from './invite-form'
import { toast } from 'sonner'
import { useState } from 'react'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { DropdownMenuItem } from './ui/dropdown-menu'
import {
  useCreateInvite,
  useGenerateInviteLink,
  useUpdateInvite,
} from '@/hooks/api/invite'

export function CreateInvite() {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  const createInviteMutation = useCreateInvite({
    onSuccess: () => {
      setOpen(false)
    },
  })

  const form = useInviteAppForm({
    ...inviteAppFormOpts,
    onSubmit: async ({ value }) => {
      toast.promise(
        async () =>
          await createInviteMutation.mutateAsync({
            email: value.email,
            role: value.role,
          }),
        {
          loading: 'Creating invite...',
          success: () => `Created successfully`,
          error: () => 'Failed to create invite',
        },
      )
    },
  })

  return (
    <Drawer
      open={open}
      direction={isMobile ? 'bottom' : 'right'}
      onOpenChange={(open) => setOpen(open)}
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
          <InviteForm form={form} />
        </div>
        <DrawerFooter>
          <Button
            type="submit"
            form="invite-form"
            onClick={() => form.handleSubmit()}
          >
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
  const isMobile = useIsMobile()

  const updateInviteMutation = useUpdateInvite(invite.id.toString(), {
    onSuccess: () => {
      if (onCallback) {
        onCallback()
      }
    },
  })

  const form = useInviteAppForm({
    ...inviteAppFormOpts,
    defaultValues: {
      email: invite.email,
      role: invite.role,
    },
    onSubmit: async ({ value }) => {
      toast.promise(async () => await updateInviteMutation.mutateAsync(value), {
        loading: 'Updating invite...',
        success: () => `Updated successfully`,
        error: () => 'Failed to update invite',
      })
    },
  })

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
          <InviteForm form={form} />
        </div>
        <DrawerFooter>
          <Button
            type="submit"
            form="invite-form"
            onClick={() => form.handleSubmit()}
          >
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

  const generateLinkMutation = useGenerateInviteLink(inviteId, {
    onSuccess: (link) => {
      copyToClipboard(link.link)
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
