import {
  createFormHook,
  createFormHookContexts,
  formOptions,
  useStore,
} from '@tanstack/react-form'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useEffect } from 'react'
import { z } from 'zod'
import { SelectTransactionCategory } from './select-transaction-category'
import { SelectChartOfAccount } from './select-chart-of-account'
import { formatAmountToCurrency } from '@bir-notebook/shared/helpers/currency'
import {
  calculateVatAmount,
  transactionVatTypeOptions,
  type TransactionVatType,
} from '@bir-notebook/shared/models/transaction'
import { useTransactionCategory } from '@/hooks/api/transaction'

export const transactionSchema = z
  .object({
    categoryId: z.number().min(1, 'Please select a category'),
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    description: z.string().min(1, 'Description is required').max(500),
    transactionDate: z.string().min(1, 'Date is required'),
    debitAccountId: z.number().min(1, 'Please select a debit account'),
    creditAccountId: z.number().min(1, 'Please select a credit account'),
    referenceNumber: z.string(),
    vatType: z.enum(transactionVatTypeOptions.map((option) => option.value)),
  })
  .refine((data) => data.debitAccountId !== data.creditAccountId, {
    message: 'Debit and credit accounts must be different',
    path: ['creditAccountId'],
  })

export type TransactionFormData = z.infer<typeof transactionSchema>

const { fieldContext, formContext } = createFormHookContexts()

const { useAppForm: useTransactionAppForm, withForm } = createFormHook({
  fieldComponents: {},
  formComponents: {},
  fieldContext,
  formContext,
})

export { useTransactionAppForm }

export const transactionAppFormOpts = formOptions({
  defaultValues: {
    categoryId: 0,
    amount: 0,
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
    debitAccountId: 0,
    creditAccountId: 0,
    referenceNumber: '',
    vatType: '',
  },
  validators: {
    onSubmit: transactionSchema,
  },
})

export const TransactionForm = withForm({
  ...transactionAppFormOpts,
  render: ({ form }) => {
    const categoryId = useStore(form.store, (state) => state.values.categoryId)

    const { data: defaultAccounts } = useTransactionCategory(
      categoryId?.toString(),
      {
        enabled: !!categoryId,
      },
    )

    useEffect(() => {
      if (defaultAccounts && categoryId && categoryId > 0) {
        form.setFieldValue(
          'debitAccountId',
          defaultAccounts.defaultDebitAccountId!,
        )
        form.setFieldValue(
          'creditAccountId',
          defaultAccounts.defaultCreditAccountId!,
        )
      }
    }, [defaultAccounts, form, categoryId])

    const amount = useStore(form.store, (state) => state.values.amount)
    const vatType = useStore(
      form.store,
      (state) => state.values.vatType,
    ) as TransactionVatType

    const vatAmount = calculateVatAmount(amount, vatType)
    const totalAmount = amount + vatAmount

    return (
      <form
        id="transaction-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <form.Field
          name="categoryId"
          children={(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Transaction Category</FieldLabel>
              <SelectTransactionCategory
                value={field.state.value}
                onChange={(categoryId) => {
                  field.handleChange((categoryId as number) ?? 0)
                }}
              />
              {field.state.meta.errors.length > 0 && (
                <FieldError errors={field.state.meta.errors} />
              )}
            </Field>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form.Field
            name="amount"
            children={(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Amount</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  placeholder="0.00"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )}
          />

          <form.Field
            name="transactionDate"
            children={(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Date</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )}
          />
        </div>

        <form.Field
          name="description"
          children={(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Description</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                placeholder="Transaction description"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              {field.state.meta.errors.length > 0 && (
                <FieldError errors={field.state.meta.errors} />
              )}
            </Field>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form.Field
            name="debitAccountId"
            children={(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Debit Account</FieldLabel>
                <SelectChartOfAccount
                  value={field.state.value}
                  onChange={(account) => {
                    field.handleChange(account?.id || 0)
                  }}
                  placeholder="Select debit account"
                />
                {field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )}
          />

          <form.Field
            name="creditAccountId"
            children={(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Credit Account</FieldLabel>
                <SelectChartOfAccount
                  value={field.state.value}
                  onChange={(account) => field.handleChange(account?.id || 0)}
                  placeholder="Select credit account"
                />
                {field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form.Field
            name="referenceNumber"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>
                  Reference Number (Optional)
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="OR #, Invoice #, etc."
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </Field>
            )}
          />

          <form.Field
            name="vatType"
            children={(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>VAT Type</FieldLabel>
                <select
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select vat type</option>
                  {transactionVatTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )}
          />
        </div>

        {vatAmount > 0 && (
          <div className="p-4 bg-blue-50 rounded-md">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatAmountToCurrency(amount)}</span>
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
  },
})
