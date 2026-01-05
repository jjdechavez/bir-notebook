import { useState } from 'react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  TransactionForm,
  transactionSchema,
  type TransactionFormData,
} from './transaction-form'
import { TransactionPreview } from './transaction-preview'
import { Edit } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tuyau } from '@/main'
import { toast } from 'sonner'

interface EditTransactionProps {
  children?: React.ReactNode
  transactionId: number
  onSuccess?: () => void
}

export function EditTransaction({
  children,
  transactionId,
  onSuccess,
}: EditTransactionProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  // Get transaction data
  const { data: transaction, isLoading: isLoadingTransaction } = useQuery(
    tuyau.api.transactions({ id: transactionId }).$get.queryOptions(),
    { enabled: !!transactionId }
  )

  // Update mutation
  const updateTransaction = useMutation(
    tuyau.api.transactions({ id: transactionId }).$put.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: tuyau.api.transactions.$get.pathKey(),
        })
        queryClient.invalidateQueries({
          queryKey: tuyau.api.transactions({ id: transactionId }).$get.pathKey(),
        })
      },
    }),
  )

  // Form default values from transaction data
  const getDefaultValues = (): TransactionFormData => {
    if (transaction) {
      return {
        categoryId: transaction.categoryId,
        amount: transaction.amount,
        description: transaction.description,
        transactionDate: new Date(transaction.transactionDate).toISOString().split('T')[0],
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

  // Reset form when transaction data loads
  React.useEffect(() => {
    if (transaction && !isLoadingTransaction) {
      form.reset(getDefaultValues())
    }
  }, [transaction, isLoadingTransaction, form])

  const formData = form.watch()
  const isValid = form.formState.isValid

  const onSubmit = async (data: TransactionFormData) => {
    toast.promise(
      updateTransaction.mutateAsync({ payload: data }),
      {
        loading: 'Updating transaction...',
        success: () => 'Transaction updated successfully',
        error: () => 'Failed to update transaction',
      },
    ).then(() => {
      setOpen(false)
      onSuccess?.()
    })
  }

  const trigger = children || (
    <Button variant="outline" size="sm">
      <Edit className="h-4 w-4 mr-2" />
      Edit
    </Button>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Edit Transaction</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {isLoadingTransaction ? (
              <div className="flex items-center justify-center py-8">
                <p>Loading transaction...</p>
              </div>
            ) : (
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
            )}
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
              disabled={updateTransaction.isPending || isLoadingTransaction}
            >
              {updateTransaction.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>

        {isLoadingTransaction ? (
          <div className="flex items-center justify-center py-16">
            <p>Loading transaction...</p>
          </div>
        ) : (
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
                disabled={updateTransaction.isPending || isLoadingTransaction}
              >
                {updateTransaction.isPending ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}