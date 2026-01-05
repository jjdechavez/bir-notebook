import { Controller, useForm, type UseFormReturn } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { SelectTransactionCategory } from './select-transaction-category'
import { SelectTransactionAccount } from './select-transaction-account'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tuyau } from '@/main'
import { formatAmountToCurrency } from '@bir-notebook/shared/helpers/currency'
import {
  calculateVatAmount,
  transactionCategoryBookTypeOptions,
  transactionVatTypeOptions,
  type TransactionVatType,
} from '@bir-notebook/shared/models/transaction'
import { formatOption } from '@bir-notebook/shared/models/common'

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
    tuyau.api['transaction-categories']({
      id: categoryId,
    }).$get.queryOptions({}, { enabled: !!categoryId }),
  )

  // Auto-fill default accounts when category changes
  useEffect(() => {
    if (defaultAccounts && form.watch('debitAccountId') === 0) {
      form.setValue('debitAccountId', defaultAccounts.debitAccountId)
      form.setValue('creditAccountId', defaultAccounts.creditAccountId)
    }
  }, [defaultAccounts, form])

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
              onChange={(category) => {
                field.onChange(category?.id || 0)
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

export function CreateTransaction(props: TransactionFormProps) {
  const queryClient = useQueryClient()
  const { data: categories } = useQuery(
    tuyau.api['transaction-categories'].$get.queryOptions(),
  )
  const { data: accounts } = useQuery(
    tuyau.api['transaction-accounts'].$get.queryOptions(),
  )
  const createTransactionMutation = useMutation(
    tuyau.api.transactions.$post.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: tuyau.api.transactions.$get.pathKey(),
        })
      },
    }),
  )
  const [showPreview, setShowPreview] = useState(false)

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
      vatType: 'vat_exempt',
    },
  })

  const categoryId = form.watch('categoryId')

  const { data: defaultAccounts } = useQuery(
    tuyau.api['transaction-categories']({
      id: categoryId,
    }).$get.queryOptions({}, { enabled: !!categoryId }),
  )

  // Auto-fill default accounts when category changes
  useEffect(() => {
    if (defaultAccounts && form.watch('debitAccountId') === 0) {
      form.setValue('debitAccountId', defaultAccounts.debitAccountId)
      form.setValue('creditAccountId', defaultAccounts.creditAccountId)
    }
  }, [defaultAccounts, form])

  const amount = form.watch('amount')

  const vatAmount = calculateVatAmount(
    amount,
    form.watch('vatType') as TransactionVatType,
  )
  const totalAmount = amount + vatAmount

  const onSubmit = props.form.handleSubmit((payload) => {
    props.onSubmit(payload)
  })

  const handlePreview = () => {
    if (form.formState.isValid) {
      setShowPreview(true)
    }
  }

  const selectedCategory = categories?.data.find((a) => a.id === categoryId)

  const selectedDebitAccount = accounts?.data.find(
    (a) => a.id === form.watch('debitAccountId'),
  )
  const selectedCreditAccount = accounts?.data.find(
    (a) => a.id === form.watch('creditAccountId'),
  )

  const vatType = form.watch('vatType') as TransactionVatType

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="transaction-form" onSubmit={onSubmit} className="space-y-4">
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Transaction Category
                  </FieldLabel>
                  <SelectTransactionCategory
                    value={field.value}
                    onChange={(category) => {
                      field.onChange(category?.id || 0)
                    }}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
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
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
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
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
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
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
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

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                disabled={!form.formState.isValid}
              >
                Preview Entry
              </Button>
              <Button
                type="submit"
                disabled={createTransactionMutation.isPending}
              >
                {createTransactionMutation.isPending
                  ? 'Creating...'
                  : 'Create Transaction'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {showPreview && selectedDebitAccount && selectedCreditAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Debit</h4>
                  <p>
                    {selectedDebitAccount.code} - {selectedDebitAccount.name}
                  </p>
                  <p className="text-2xl font-bold">
                    {formatAmountToCurrency(form.watch('amount'))}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Credit</h4>
                  <p>
                    {selectedCreditAccount.code} - {selectedCreditAccount.name}
                  </p>
                  <p className="text-2xl font-bold">
                    {formatAmountToCurrency(form.watch('amount'))}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p>
                  <strong>Book:</strong>{' '}
                  {selectedCategory
                    ? formatOption(
                        transactionCategoryBookTypeOptions,
                        selectedCategory.bookType,
                      )
                    : 'N/A'}
                </p>
                <p>
                  <strong>Description:</strong> {form.watch('description')}
                </p>
                <p>
                  <strong>Date:</strong> {form.watch('transactionDate')}
                </p>
                {form.watch('referenceNumber') && (
                  <p>
                    <strong>Reference:</strong> {form.watch('referenceNumber')}
                  </p>
                )}
                <p>
                  <strong>VAT Type:</strong>{' '}
                  {formatOption(transactionVatTypeOptions, vatType)}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Back to Edit
                </Button>
                <Button
                  form="transaction-form"
                  type="submit"
                  disabled={createTransactionMutation.isPending}
                >
                  {createTransactionMutation.isPending
                    ? 'Creating...'
                    : 'Confirm & Create'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
