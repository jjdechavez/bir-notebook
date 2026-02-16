import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { LedgerTransaction } from '@/types/general-ledger'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { tuyau } from '@/main'

// Schema for editing GL transaction description
const glEditSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(255, 'Description must be less than 255 characters'),
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<GlEditFormData>({
    resolver: zodResolver(glEditSchema),
    defaultValues: {
      description: glTransaction.description,
    },
  })

  const updateGlMutation = useMutation(
    tuyau.api.transactions.gl['update-description'].$put.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            tuyau.api.transactions['general-ledger'].view.$get.queryKey(),
        })
        queryClient.invalidateQueries({
          queryKey: tuyau.api.transactions['transfer-history'].$get.queryKey(),
        })
        toast.success('GL transaction description updated successfully')
        onSuccess?.()
        onClose()
        setIsSubmitting(false)
      },
      onError: (error) => {
        toast.error('Failed to update GL transaction description')
        setIsSubmitting(false)
      },
    }),
  )

  const onSubmit = (data: GlEditFormData) => {
    setIsSubmitting(true)
    updateGlMutation.mutate({
      params: { id: glTransaction.id },
      payload: { description: data.description },
    })
  }

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset()
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
          <div className="space-y-2">
            <Label htmlFor="description">GL Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Enter GL transaction description..."
              rows={3}
              maxLength={255}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground text-right">
              {form.watch('description')?.length || 0}/255 characters
            </p>
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              This description will appear in the General Ledger view for this
              GL transaction group.
            </p>
            <p>
              Current:{' '}
              <span className="font-medium">{glTransaction.description}</span>
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Description'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
