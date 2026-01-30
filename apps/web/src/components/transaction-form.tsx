import { Controller, type UseFormReturn } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useEffect } from 'react'
import { z } from 'zod'
import { SelectTransactionCategory } from './select-transaction-category'
import { SelectTransactionAccount } from './select-transaction-account'
import { useQuery } from '@tanstack/react-query'
import { tuyau } from '@/main'
import { formatAmountToCurrency } from '@bir-notebook/shared/helpers/currency'
import {
  calculateVatAmount,
  transactionVatTypeOptions,
  type TransactionVatType,
} from '@bir-notebook/shared/models/transaction'

export const transactionSchema = z
  .object({
    categoryId: z.number().min(1, 'Please select a category'),
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    description: z.string().min(1, 'Description is required').max(500),
    transactionDate: z.string().min(1, 'Date is required'),
    debitAccountId: z.number().min(1, 'Please select a debit account'),
    creditAccountId: z.number().min(1, 'Please select a credit account'),
    referenceNumber: z.string().optional(),
    vatType: z.enum(transactionVatTypeOptions.map((option) => option.value)),
  })
  .refine((data) => data.debitAccountId !== data.creditAccountId, {
    message: 'Debit and credit accounts must be different',
    path: ['creditAccountId'],
  })

export type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  onSubmit: (input: TransactionFormData) => void
  form: UseFormReturn<TransactionFormData>
}

export function TransactionForm({ form, ...props }: TransactionFormProps) {
  const categoryId = form.watch('categoryId')

  const { data: defaultAccounts } = useQuery(
    tuyau.api['transaction-categories']({ id: categoryId }).$get.queryOptions(
      {
        payload: {
          id: categoryId,
        },
      },
      {
        enabled: !!categoryId,
      },
    ),
  )

  useEffect(() => {
    if (defaultAccounts && categoryId && categoryId > 0) {
      form.setValue('debitAccountId', defaultAccounts.defaultDebitAccountId)
      form.setValue('creditAccountId', defaultAccounts.defaultCreditAccountId)
    }
  }, [defaultAccounts, form, categoryId])

  const amount = form.watch('amount')

  const vatAmount = calculateVatAmount(
    amount,
    form.watch('vatType') as TransactionVatType,
  )
  const totalAmount = amount + vatAmount

  const onSubmit = form.handleSubmit((payload) => {
    props.onSubmit(payload)
  })

  return (
    <form id="transaction-form" onSubmit={onSubmit} className="space-y-4">
      <Controller
        control={form.control}
        name="categoryId"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Transaction Category</FieldLabel>
            <SelectTransactionCategory
              value={field.value}
              onChange={(categoryId) => {
                field.onChange(categoryId ?? null)
              }}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          control={form.control}
          name="amount"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Amount</FieldLabel>
              <Input
                {...field}
                type="number"
                placeholder="0.00"
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="transactionDate"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Date</FieldLabel>
              <Input {...field} type="date" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Controller
        control={form.control}
        name="description"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Description</FieldLabel>
            <Input {...field} placeholder="Transaction description" />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          control={form.control}
          name="debitAccountId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Debit Account</FieldLabel>
              <SelectTransactionAccount
                value={field.value}
                onChange={(account) => {
                  field.onChange(account?.id || 0)
                }}
                placeholder="Select debit account"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="creditAccountId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Credit Account</FieldLabel>
              <SelectTransactionAccount
                value={field.value}
                onChange={(account) => field.onChange(account?.id || 0)}
                placeholder="Select credit account"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          control={form.control}
          name="referenceNumber"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={field.name}>
                Reference Number (Optional)
              </FieldLabel>
              <Input {...field} placeholder="OR #, Invoice #, etc." />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="vatType"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>VAT Type</FieldLabel>
              <select
                {...field}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value as any)}
                className="w-full p-2 border rounded-md"
              >
                <option value="vat_exempt">VAT Exempt</option>
                <option value="vat_zero">VAT Zero-Rated</option>
                <option value="vat_standard">VAT Standard (12%)</option>
              </select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      {vatAmount > 0 && (
        <div className="p-4 bg-blue-50 rounded-md">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatAmountToCurrency(form.watch('amount'))}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT (12%):</span>
            <span>{formatAmountToCurrency(vatAmount)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span>{formatAmountToCurrency(totalAmount)}</span>
          </div>
        </div>
      )}
    </form>
  )
}
