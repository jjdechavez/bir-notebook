import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import { ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react'
import { tuyau } from '@/main'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Transaction } from '@/types/transaction'
import type { TransferValidationResult } from '@/types/general-ledger'
import { generateMonthOptions } from '@/lib/general-ledger-helpers'
import { Spinner } from '@/components/ui/spinner'

type GeneralLedgerTransferDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialSelectedTransactions?: number[]
}

type TransactionSelectionProps = {
  selectedTransactions: number[]
  onSelectionChange: (ids: number[]) => void
  onNext: () => void
  availableTransactions: Transaction[]
  validationError?: string
}

type MonthAssignmentProps = {
  selectedTransactions: number[]
  onNext: () => void
  onBack: () => void
  targetMonth: string
  onTargetMonthChange: (month: string) => void
}

type ConfirmationProps = {
  selectedTransactions: number[]
  targetMonth: string
  onConfirm: () => void
  onBack: () => void
  isLoading?: boolean
  validation?: TransferValidationResult
}

function TransactionSelectionStep({
  selectedTransactions,
  onSelectionChange,
  onNext,
  availableTransactions,
  validationError,
}: TransactionSelectionProps) {
  const handleTransactionToggle = (transactionId: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedTransactions, transactionId])
    } else {
      onSelectionChange(
        selectedTransactions.filter((id) => id !== transactionId),
      )
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(availableTransactions.map((t) => t.id))
    } else {
      onSelectionChange([])
    }
  }

  const eligibleTransactions = availableTransactions.filter(
    (t) => t.recorded && !(t as any).transferredToGlAt,
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select Transactions</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={
              selectedTransactions.length === eligibleTransactions.length &&
              eligibleTransactions.length > 0
            }
            onCheckedChange={handleSelectAll}
          />
          <Label htmlFor="select-all">Select All</Label>
        </div>
      </div>

      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-muted-foreground">
        Only recorded transactions that haven't been transferred can be
        selected.
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2">
        {eligibleTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No eligible transactions found. Only recorded transactions that
            haven't been transferred can be selected.
          </div>
        ) : (
          eligibleTransactions.map((transaction) => (
            <Card
              key={transaction.id}
              className={`p-4 cursor-pointer transition-colors ${
                selectedTransactions.includes(transaction.id)
                  ? 'bg-blue-50 border-blue-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={selectedTransactions.includes(transaction.id)}
                  onCheckedChange={(checked) =>
                    handleTransactionToggle(transaction.id, checked as boolean)
                  }
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {new Date(
                            transaction.transactionDate,
                          ).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {transaction.referenceNumber}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {transaction.bookType?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCentsToCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.debitAccount?.code} →{' '}
                        {transaction.creditAccount?.code}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-muted-foreground">
          {selectedTransactions.length} transaction
          {selectedTransactions.length !== 1 ? 's' : ''} selected
        </div>
        <Button onClick={onNext} disabled={selectedTransactions.length === 0}>
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function MonthAssignmentStep({
  selectedTransactions,
  onNext,
  onBack,
  targetMonth,
  onTargetMonthChange,
}: MonthAssignmentProps) {
  const monthOptions = generateMonthOptions()

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Assign Target Month</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Select the month for posting these {selectedTransactions.length}{' '}
          transaction{selectedTransactions.length !== 1 ? 's' : ''} to the
          General Ledger.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="target-month">Target Month</Label>
        <select
          id="target-month"
          value={targetMonth}
          onChange={(e) => onTargetMonthChange(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="">Select a month</option>
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transfer Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Transactions to transfer:</span>
            <span className="font-medium">{selectedTransactions.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Target posting month:</span>
            <span className="font-medium">{targetMonth || 'Not selected'}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!targetMonth}>
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function ConfirmationStep({
  selectedTransactions,
  targetMonth,
  onConfirm,
  onBack,
  isLoading = false,
  validation,
}: ConfirmationProps) {
  if (!validation) {
    return <div>Loading validation...</div>
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Confirm Transfer</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Review the transfer details before confirming.
        </p>
      </div>

      {validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validation.warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Check className="h-5 w-5 text-success-foreground" />
            Transfer Ready
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Eligible Transactions
              </p>
              <p className="text-lg font-semibold text-success-foreground">
                {validation.eligibleTransactions.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Target Month</p>
              <p className="text-lg font-semibold">{targetMonth}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-2">Transfer Impact:</p>
            <p className="text-sm text-muted-foreground">
              Select month for posting these {selectedTransactions.length}{' '}
              transaction{selectedTransactions.length !== 1 ? 's' : ''} to
              General Ledger.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading || validation.eligibleTransactions.length === 0}
        >
          {isLoading ? 'Transferring...' : 'Confirm Transfer'}
        </Button>
      </div>
    </div>
  )
}

export function GeneralLedgerTransferDialog({
  isOpen,
  onClose,
  onSuccess,
  initialSelectedTransactions = [],
}: GeneralLedgerTransferDialogProps) {
  const [step, setStep] = useState<'select' | 'assign' | 'confirm'>('select')
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>(
    initialSelectedTransactions,
  )
  const [targetMonth, setTargetMonth] = useState('')
  const queryClient = useQueryClient()

  const { data: transactionsData, status: transactionsStatus } = useQuery(
    tuyau.api.transactions.$get.queryOptions({
      payload: {
        record: 'recorded', // Only recorded transactions
        limit: 1000,
      },
    }),
  )

  const transferValidationMutation = useMutation(
    tuyau.api.transactions.transfer.validate.$post.mutationOptions({}),
  )

  const transferMutation = useMutation(
    tuyau.api.transactions['transfer-to-general-ledger'].$post.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: tuyau.api.transactions.$get.queryKey(),
        })
        onSuccess?.()
        onClose()
      },
    }),
  )

  const handleNext = () => {
    if (step === 'select') setStep('assign')
    else if (step === 'assign') {
      transferValidationMutation.mutate({
        payload: { transactionIds: selectedTransactions },
      })
      setStep('confirm')
    }
  }

  const handleBack = () => {
    if (step === 'assign') setStep('select')
    else if (step === 'confirm') setStep('assign')
  }

  const handleConfirmTransfer = () => {
    transferMutation.mutate({
      payload: {
        transactionIds: selectedTransactions,
        targetMonth,
      },
    })
  }

  const resetDialog = () => {
    setStep('select')
    setSelectedTransactions(initialSelectedTransactions)
    setTargetMonth('')
    transferMutation.reset()
  }

  const handleClose = () => {
    resetDialog()
    onClose()
  }

  if (transactionsStatus === 'pending') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle>Transfer to General Ledger</DialogTitle>
        </DialogHeader>

        {step === 'select' && (
          <TransactionSelectionStep
            selectedTransactions={selectedTransactions}
            onSelectionChange={setSelectedTransactions}
            onNext={handleNext}
            availableTransactions={transactionsData?.data || []}
            validationError={transferMutation.error?.message}
          />
        )}

        {step === 'assign' && (
          <MonthAssignmentStep
            selectedTransactions={selectedTransactions}
            onNext={handleNext}
            onBack={handleBack}
            targetMonth={targetMonth}
            onTargetMonthChange={setTargetMonth}
          />
        )}

        {step === 'confirm' && (
          <ConfirmationStep
            selectedTransactions={selectedTransactions}
            targetMonth={targetMonth}
            onConfirm={handleConfirmTransfer}
            onBack={handleBack}
            isLoading={transferMutation.isPending}
            validation={transferValidationMutation.data}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
