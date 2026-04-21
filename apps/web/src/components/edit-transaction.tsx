import { useStore } from "@tanstack/react-form"
import { useIsMobile } from "@/hooks/use-mobile"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
	transactionAppFormOpts,
	TransactionForm,
	useTransactionAppForm,
	type TransactionFormData,
} from "./transaction-form"
import { TransactionPreview } from "./transaction-preview"
import { toast } from "sonner"
import type { Transaction } from "@/types/transaction"
import { fromCentsToPrice } from "@bir-notebook/shared/helpers/currency"
import { useUpdateTransaction } from "@/hooks/api/transaction"

interface EditTransactionProps {
	open: boolean
	transaction: Transaction
	onSuccess?: () => void
	onToggleOpen: () => void
}

export function EditTransaction({
	transaction,
	onSuccess,
	open,
	onToggleOpen,
}: EditTransactionProps) {
	const isMobile = useIsMobile()

	const updateTransaction = useUpdateTransaction(transaction.id, {
		onSuccess: () => {
			onSuccess?.()
		},
	})

	const form = useTransactionAppForm({
		...transactionAppFormOpts,
		defaultValues: {
			categoryId: transaction.categoryId,
			amount: fromCentsToPrice(transaction.amount),
			description: transaction.description,
			transactionDate: new Date(transaction.transactionDate)
				.toISOString()
				.split("T")[0],
			debitAccountId: transaction.debitAccountId,
			creditAccountId: transaction.creditAccountId,
			referenceNumber: transaction.referenceNumber || "",
			vatType: transaction.vatType as string,
		},
		onSubmit: async ({ value }) => {
			toast.promise(
				updateTransaction.mutateAsync(value as TransactionFormData),
				{
					loading: "Updating transaction...",
					success: () => "Transaction updated successfully",
					error: () => "Failed to update transaction",
				},
			)
		},
	})

	const formData = useStore(
		form.store,
		(state) => state.values,
	) as TransactionFormData
	const isValid =
		formData.categoryId > 0 &&
		formData.amount > 0 &&
		formData.description.length > 0 &&
		formData.transactionDate.length > 0 &&
		formData.debitAccountId > 0 &&
		formData.creditAccountId > 0

	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={(isOpen) => !isOpen && onToggleOpen()}>
				<DrawerContent className="max-h-[90vh]">
					<DrawerHeader>
						<DrawerTitle>Edit Transaction</DrawerTitle>
					</DrawerHeader>
					<div className="flex-1 overflow-y-auto px-4 pb-4">
						<Tabs defaultValue="form" className="w-full">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="form">Form</TabsTrigger>
								<TabsTrigger value="preview">Preview</TabsTrigger>
							</TabsList>

							<TabsContent value="form" className="mt-4">
								<TransactionForm form={form} />
							</TabsContent>

							<TabsContent value="preview" className="mt-4">
								<TransactionPreview formData={formData} isValid={isValid} />
							</TabsContent>
						</Tabs>
					</div>
					<DrawerFooter>
						<DrawerClose asChild>
							<form.Subscribe
								selector={(state) => [state.isSubmitting]}
								children={([isSubmitting]) => (
									<Button
										type="button"
										variant="secondary"
										disabled={isSubmitting}
									>
										Cancel
									</Button>
								)}
							/>
						</DrawerClose>
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
							children={([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									form="transaction-form"
									disabled={!canSubmit || isSubmitting}
									onClick={() => form.handleSubmit()}
								>
									{isSubmitting ? "Updating..." : "Update"}
								</Button>
							)}
						/>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		)
	}

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onToggleOpen()}>
			<DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Edit Transaction</DialogTitle>
				</DialogHeader>

				<>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div>
							<TransactionForm form={form} />
						</div>
						<div className="lg:sticky lg:top-0">
							<TransactionPreview formData={formData} isValid={isValid} />
						</div>
					</div>

					<DialogFooter>
						<DialogClose asChild>
							<form.Subscribe
								selector={(state) => [state.isSubmitting]}
								children={([isSubmitting]) => (
									<Button
										type="button"
										variant="secondary"
										disabled={isSubmitting}
									>
										Cancel
									</Button>
								)}
							/>
						</DialogClose>
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
							children={([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									form="transaction-form"
									disabled={!canSubmit || isSubmitting}
									onClick={() => form.handleSubmit()}
								>
									{isSubmitting ? "Updating..." : "Update"}
								</Button>
							)}
						/>
					</DialogFooter>
				</>
			</DialogContent>
		</Dialog>
	)
}
