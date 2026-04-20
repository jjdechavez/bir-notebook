import { useState } from 'react'
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
  transactionAppFormOpts,
  TransactionForm,
  useTransactionAppForm,
  type TransactionFormData,
} from './transaction-form'
import { TransactionPreview } from './transaction-preview'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@tanstack/react-form'
import { useCreateTransaction } from '@/hooks/api/transaction'

interface CreateTransactionProps {
  children?: React.ReactNode
  onSuccess?: () => void
}

export function CreateTransaction({
  children,
  onSuccess,
}: CreateTransactionProps) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  const createTransaction = useCreateTransaction({
    onSuccess: () => {
      setOpen(false)
      onSuccess?.()
    },
  })

  const form = useTransactionAppForm({
    ...transactionAppFormOpts,
    onSubmit: async ({ value }) => {
      toast.promise(
        createTransaction.mutateAsync(value as TransactionFormData),
        {
          loading: 'Creating transaction...',
          success: () => 'Transaction created successfully',
          error: () => 'Failed to create transaction',
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
                  {isSubmitting ? 'Creating...' : 'Create'}
                </Button>
              )}
            />
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
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            )}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
