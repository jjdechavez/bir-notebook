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
import { Plus } from 'lucide-react'
import { transactionVatTypes } from '@bir-notebook/shared/models/transaction'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tuyau } from '@/main'
import { toast } from 'sonner'

interface CreateTransactionProps {
  children?: React.ReactNode
  onSuccess?: () => void
}

export function CreateTransaction({
  children,
  onSuccess,
}: CreateTransactionProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  const createTransaction = useMutation(
    tuyau.api.transactions.$post.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: tuyau.api.transactions.$get.pathKey(),
        })
      },
    }),
  )

  const form = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      categoryId: 0,
      amount: 0,
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
      debitAccountId: 0,
      creditAccountId: 0,
      referenceNumber: '',
      vatType: transactionVatTypes.vatExempt,
    },
  })

  const formData = form.watch()
  const isValid = form.formState.isValid

  const onSubmit = async (data: TransactionFormData) => {
    toast.promise(
      async () =>
        createTransaction.mutateAsync(
          { payload: data },
          {
            onSuccess: () => {
              form.reset()
              setOpen(false)
              onSuccess?.()
            },
          },
        ),
      {
        loading: 'Creating transaction...',
        success: () => 'Created successfully',
        error: () => 'Failed to create transaction',
      },
    )
  }

  const trigger = children || (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Create Transaction
    </Button>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Create Transaction</DrawerTitle>
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
            <Button type="submit" form="transaction-form">
              Create
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
          <DialogTitle>Create Transaction</DialogTitle>
        </DialogHeader>

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
          <Button type="submit" form="transaction-form">
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
