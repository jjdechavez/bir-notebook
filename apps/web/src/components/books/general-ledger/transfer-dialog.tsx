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
import { formatDate, generateMonthOptions } from '@/lib/general-ledger-helpers'
import { Spinner } from '@/components/ui/spinner'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'
import { formatOption } from '@bir-notebook/shared/models/common'
import { transactionCategoryBookTypeOptions } from '@bir-notebook/shared/models/transaction'

function groupTransactionsByAccounts(transactions: Transaction[]) {
  return transactions.reduce(
    (groups, transaction) => {
      const key = `${transaction.debitAccountId}-${transaction.creditAccountId}`

      if (!groups[key]) {
        groups[key] = {
          debitAccountId: transaction.debitAccountId,
          debitAccount: transaction.debitAccount,
          creditAccountId: transaction.creditAccountId,
          creditAccount: transaction.creditAccount,
          transactions: [],
        }
      }

      groups[key].transactions.push(transaction)
      return groups
    },
    {} as Record<
      string,
      {
        debitAccountId: number
        debitAccount: Transaction['debitAccount']
        creditAccountId: number
        creditAccount: Transaction['creditAccount']
        transactions: Transaction[]
      }
    >,
  )
}

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
  glDescription: string
  onGlDescriptionChange: (description: string) => void
}

type ConfirmationProps = {
  targetMonth: string
  glDescription: string
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
    (t) => t.recorded && !t.transferredToGlAt,
  )

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Select Transactions</h3>
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
        <div className="text-sm text-muted-foreground">
          Only recorded transactions that haven't been transferred can be
          selected.
        </div>
      </div>

      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <div className="max-h-96 overflow-y-auto space-y-2">
        {eligibleTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No eligible transactions found. Only recorded transactions that
            haven't been transferred can be selected.
          </div>
        ) : (
          <FieldGroup className="gap-y-2">
            {eligibleTransactions.map((transaction) => (
              <FieldLabel key={transaction.id} className="cursor-pointer">
                <Field orientation="horizontal">
                  <Checkbox
                    checked={selectedTransactions.includes(transaction.id)}
                    onCheckedChange={(checked) =>
                      handleTransactionToggle(
                        transaction.id,
                        checked as boolean,
                      )
                    }
                  />
                  <FieldContent>
                    <FieldTitle className="w-full flex justify-between">
                      <p>{transaction.description}</p>
                      <span>{formatCentsToCurrency(transaction.amount)}</span>
                    </FieldTitle>
                    <FieldDescription className="flex justify-between">
                      <div className="flex gap-x-2">
                        <span>{formatDate(transaction.transactionDate)}</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {transaction.referenceNumber}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {formatOption(
                            transactionCategoryBookTypeOptions,
                            transaction.bookType,
                          )}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {transaction.debitAccount?.code} →{' '}
                          {transaction.creditAccount?.code}
                        </p>
                      </div>
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
            ))}
          </FieldGroup>
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
  glDescription,
  onGlDescriptionChange,
}: MonthAssignmentProps) {
  const monthOptions = generateMonthOptions()

  const { data: transactionsData } = useQuery(
    tuyau.api.transactions.$get.queryOptions({
      payload: {
        record: 'recorded',
        limit: 1000,
      },
    }),
  )

  const selectedTransactionsData =
    transactionsData?.data?.filter((t) =>
      selectedTransactions.includes(t.id),
    ) || []

  const accountGroups = groupTransactionsByAccounts(selectedTransactionsData)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Assign Target Month</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Select the month for posting these {selectedTransactions.length}{' '}
          transaction{selectedTransactions.length !== 1 ? 's' : ''} to the
          General Ledger.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="space-y-4 flex-1">
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

          <div className="space-y-2">
            <Label htmlFor="gl-description">GL Description</Label>
            <textarea
              id="gl-description"
              value={glDescription}
              onChange={(e) => onGlDescriptionChange(e.target.value)}
              placeholder="e.g., Jan Totals sales, Q1 expenses, Year-end closing"
              className="w-full p-2 border rounded-md resize-none"
              rows={3}
              maxLength={255}
            />
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                This description will be shown for all transferred transactions
                in the General Ledger
              </p>
              <p className="text-xs text-muted-foreground">
                {glDescription.length}/255 characters
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Groups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                This transfer will create {Object.keys(accountGroups).length} GL
                group(s) based on account pairs:
              </p>
              {Object.values(accountGroups).map((group, index) => (
                <div key={index} className="p-3 bg-muted rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium">
                        {group.transactions.length} transaction
                        {group.transactions.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {group.debitAccount?.code} ({group.debitAccount?.name})
                        → {group.creditAccount?.code} (
                        {group.creditAccount?.name})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCentsToCurrency(
                          group.transactions.reduce(
                            (sum, t) => sum + t.amount,
                            0,
                          ),
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total amount
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transfer Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Transactions to transfer:</span>
                <span className="font-medium">
                  {selectedTransactions.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Target posting month:</span>
                <span className="font-medium">
                  {targetMonth || 'Not selected'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!targetMonth || !glDescription.trim()}
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function ConfirmationStep({
  targetMonth,
  glDescription,
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

          <div className="space-y-2">
            <p className="text-sm font-medium">GL Description:</p>
            <div className="p-2 bg-muted rounded-md text-sm">
              {glDescription}
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-2">Transfer Impact:</p>
            <p className="text-sm text-muted-foreground">
              {validation.eligibleTransactions.length} transaction
              {validation.eligibleTransactions.length !== 1 ? 's' : ''} will be
              transferred to General Ledger for {targetMonth} with the
              description above.
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
  const [glDescription, setGlDescription] = useState('')
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
        glDescription,
      },
    })
  }

  const resetDialog = () => {
    setStep('select')
    setSelectedTransactions(initialSelectedTransactions)
    setTargetMonth('')
    setGlDescription('')
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
            glDescription={glDescription}
            onGlDescriptionChange={setGlDescription}
          />
        )}

        {step === 'confirm' && (
          <ConfirmationStep
            targetMonth={targetMonth}
            glDescription={glDescription}
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
