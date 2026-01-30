import { Badge } from '@/components/ui/badge'
import { type TransactionFormData } from './transaction-form'
import { useQuery } from '@tanstack/react-query'
import { tuyau } from '@/main'
import {
  calculateVatAmount,
  transactionCategoryBookTypeOptions,
  transactionVatTypeOptions,
} from '@bir-notebook/shared/models/transaction'
import { formatAmountToCurrency } from '@bir-notebook/shared/helpers/currency'
import { formatOption } from '@bir-notebook/shared/models/common'

interface TransactionPreviewProps {
  formData: TransactionFormData
  isValid: boolean
}

export function TransactionPreview({
  formData,
  isValid,
}: TransactionPreviewProps) {
  const { data: selectedCategory } = useQuery(
    tuyau.api['transaction-categories'][':id'].$get.queryOptions(
      {
        payload: { id: formData.categoryId },
      },
      { enabled: !!formData.categoryId },
    ),
  )
  const { data: accounts } = useQuery(
    tuyau.api['transaction-accounts'].$get.queryOptions({}),
  )

  const selectedDebitAccount = accounts?.data.find(
    (a) => a.id === formData.debitAccountId,
  )
  const selectedCreditAccount = accounts?.data.find(
    (a) => a.id === formData.creditAccountId,
  )

  const vatAmount = calculateVatAmount(formData.amount, formData.vatType)
  const totalAmount = formData.amount + vatAmount

  if (!isValid) {
    return (
      <div className="p-6 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Transaction Preview</h3>
        <p className="text-gray-500 text-center py-8">
          Complete the form to see a preview of your transaction
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 border rounded-lg bg-background">
      <h3 className="text-lg font-semibold mb-4">Transaction Preview</h3>

      <div className="space-y-4">
        {/* Journal Entry */}
        <div className="border-b pb-4">
          <h4 className="font-medium mb-3">Journal Entry</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Debit</p>
              <div className="bg-background p-3 rounded border">
                <p className="font-medium">
                  {selectedDebitAccount?.name || 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedDebitAccount?.code || 'N/A'}
                </p>
                <p className="text-lg font-bold text-green-600 mt-2">
                  {formatAmountToCurrency(formData.amount)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Credit</p>
              <div className="bg-background p-3 rounded border">
                <p className="font-medium">
                  {selectedCreditAccount?.name || 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedCreditAccount?.code || 'N/A'}
                </p>
                <p className="text-lg font-bold text-destructive-foreground mt-2">
                  {formatAmountToCurrency(formData.amount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="border-b pb-4">
          <h4 className="font-medium mb-3">Transaction Details</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Description:</span>
              <span className="font-medium">{formData.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{formData.transactionDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium">
                {selectedCategory?.name || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Book:</span>
              <Badge variant="outline">
                {selectedCategory
                  ? formatOption(
                      transactionCategoryBookTypeOptions,
                      selectedCategory.bookType,
                    )
                  : 'N/A'}
              </Badge>
            </div>
            {formData.referenceNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference:</span>
                <span className="font-medium">{formData.referenceNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT Type:</span>
              <Badge
                variant={
                  formData.vatType === 'vat_standard' ? 'default' : 'secondary'
                }
              >
                {formatOption(transactionVatTypeOptions, formData.vatType)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div>
          <h4 className="font-medium mb-3">Financial Summary</h4>
          <div className="bg-background p-4 rounded border space-y-2">
            <div className="flex justify-between">
              <span>Transaction Amount:</span>
              <span className="font-medium">
                {formatAmountToCurrency(formData.amount)}
              </span>
            </div>
            {vatAmount > 0 && (
              <>
                <div className="flex justify-between">
                  <span>VAT (12%):</span>
                  <span className="font-medium">
                    {formatAmountToCurrency(vatAmount)}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total Amount:</span>
                  <span>{formatAmountToCurrency(totalAmount)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Compliance Note */}
        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>BIR Compliance:</strong> This transaction will be recorded
            in the
            {selectedCategory &&
              ` ${formatOption(transactionCategoryBookTypeOptions, selectedCategory.bookType).toLowerCase()} `}
            with proper double-entry bookkeeping.
          </p>
        </div>
      </div>
    </div>
  )
}
