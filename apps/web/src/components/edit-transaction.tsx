import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  TransactionForm,
  transactionSchema,
  type TransactionFormData,
} from './transaction-form'
import { TransactionPreview } from './transaction-preview'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tuyau } from '@/main'
import { toast } from 'sonner'
import type { Transaction } from '@/types/transaction'
import { fromCentsToPrice } from '@bir-notebook/shared/helpers/currency'

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
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()

  const updateTransaction = useMutation(
    tuyau.api.transactions({ id: transaction.id }).$put.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: tuyau.api.transactions.$get.pathKey(),
        })
        queryClient.invalidateQueries({
          queryKey: tuyau.api
            .transactions({ id: transaction.id })
            .$get.pathKey(),
        })

        onSuccess?.()
      },
    }),
  )

  const getDefaultValues = (): TransactionFormData => {
    if (transaction) {
      return {
        categoryId: transaction.categoryId,
        amount: fromCentsToPrice(transaction.amount),
        description: transaction.description,
        transactionDate: new Date(transaction.transactionDate)
          .toISOString()
          .split('T')[0],
        debitAccountId: transaction.debitAccountId,
        creditAccountId: transaction.creditAccountId,
        referenceNumber: transaction.referenceNumber || '',
        vatType: transaction.vatType,
      }
    }

    // Fallback values (shouldn't be used when transaction is loaded)
    return {
      categoryId: 0,
      amount: 0,
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
      debitAccountId: 0,
      creditAccountId: 0,
      referenceNumber: '',
      vatType: 'vat_exempt',
    }
  }

  const form = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: getDefaultValues(),
  })

  const formData = form.watch()
  const isValid = form.formState.isValid

  const onSubmit = async (data: TransactionFormData) => {
    toast.promise(updateTransaction.mutateAsync({ payload: data }), {
      loading: 'Updating transaction...',
      success: () => 'Transaction updated successfully',
      error: () => 'Failed to update transaction',
    })
  }

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
                <TransactionForm form={form} onSubmit={onSubmit} />
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <TransactionPreview formData={formData} isValid={isValid} />
              </TabsContent>
            </Tabs>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DrawerClose>
            <Button
              type="submit"
              form="transaction-form"
              disabled={updateTransaction.isPending}
            >
              {updateTransaction.isPending ? 'Updating...' : 'Update'}
            </Button>
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
              <TransactionForm form={form} onSubmit={onSubmit} />
            </div>
            <div className="lg:sticky lg:top-0">
              <TransactionPreview formData={formData} isValid={isValid} />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              form="transaction-form"
              disabled={updateTransaction.isPending}
            >
              {updateTransaction.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </>
      </DialogContent>
    </Dialog>
  )
}
