import { Button } from "./ui/button"
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "./ui/drawer"
import { userAppFormOpts, UserForm, useUserAppForm } from "./user-form"
import type { User } from "@/types/user"
import { useIsMobile } from "@/hooks/use-mobile"
import { toast } from "sonner"
import { useUpdateUser } from "@/hooks/api/user"

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
	const isMobile = useIsMobile()
	const updateUserMutation = useUpdateUser(user.id, {
		onSuccess: () => {
			if (onCallback) {
				onCallback()
			}
		},
	})

	const form = useUserAppForm({
		...userAppFormOpts,
		defaultValues: {
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role,
		},
		onSubmit: async ({ value }) => {
			toast.promise(async () => await updateUserMutation.mutateAsync(value), {
				loading: "Updating user...",
				success: () => `Updated successfully`,
				error: () => "Failed to update user",
			})
		},
	})

	return (
		<Drawer
			open={open}
			direction={isMobile ? "bottom" : "right"}
			onOpenChange={(isOpen) => !isOpen && onToggleOpen()}
		>
			<DrawerContent>
				<DrawerHeader className="gap-1">
					<DrawerTitle>Edit User</DrawerTitle>
					<DrawerDescription>User personal information</DrawerDescription>
				</DrawerHeader>

				<div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
					<UserForm form={form} />
				</div>
				<DrawerFooter>
					<Button
						type="submit"
						form="user-form"
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
