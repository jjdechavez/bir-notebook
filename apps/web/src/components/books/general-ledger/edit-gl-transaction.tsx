import type { LedgerTransaction } from "@bir-notebook/shared/models/general-ledger"
import { useForm, useStore } from "@tanstack/react-form"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { FieldError } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateGeneralLedger } from "@/hooks/api/transaction"

const glEditSchema = z.object({
	description: z
		.string()
		.min(1, "Description is required")
		.max(255, "Description must be less than 255 characters"),
})

type GlEditFormData = z.infer<typeof glEditSchema>

interface EditGlTransactionProps {
	isOpen: boolean
	onClose: () => void
	onSuccess?: () => void
	glTransaction: LedgerTransaction
}

export function EditGlTransaction({
	isOpen,
	onClose,
	onSuccess,
	glTransaction,
}: EditGlTransactionProps) {
	const updateGlMutation = useUpdateGeneralLedger({
		onSuccess: () => {
			toast.success("GL transaction description updated successfully")
			onSuccess?.()
			onClose()
		},
		onError: () => {
			toast.error("Failed to update GL transaction description")
		},
	})

	const form = useForm({
		defaultValues: {
			description: glTransaction.description,
		} as GlEditFormData,
		onSubmit: async ({ value }) => {
			updateGlMutation.mutate({
				id: glTransaction.id,
				description: value.description,
			})
		},
	})

	const descriptionValue = useStore(
		form.store,
		(state) => state.values.description,
	)

	const handleClose = () => {
		if (!form.state.isSubmitting) {
			onClose()
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Edit GL Transaction Description</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<form.Field name="description">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>GL Description</Label>
								<Textarea
									id={field.name}
									name={field.name}
									placeholder="Enter GL transaction description..."
									rows={3}
									maxLength={255}
									disabled={form.state.isSubmitting}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
								/>
								<p className="text-xs text-muted-foreground text-right">
									{descriptionValue?.length || 0}/255 characters
								</p>
								{!field.state.meta.isValid && (
									<FieldError errors={field.state.meta.errors} />
								)}
							</div>
						)}
					</form.Field>

					<div className="text-sm text-muted-foreground space-y-1">
						<p>
							This description will appear in the General Ledger view for this
							GL transaction group.
						</p>
						<p>
							Current:{" "}
							<span className="font-medium">{glTransaction.description}</span>
						</p>
					</div>
				</div>

				<div className="flex justify-end space-x-2">
					<form.Subscribe selector={(state) => [state.isSubmitting]}>
						{([isSubmitting]) => (
							<Button type="button" variant="outline" disabled={isSubmitting}>
								Cancel
							</Button>
						)}
					</form.Subscribe>

					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button
								onClick={() => form.handleSubmit()}
								disabled={!canSubmit || isSubmitting}
							>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Updating...
									</>
								) : (
									"Update Description"
								)}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</DialogContent>
		</Dialog>
	)
}
