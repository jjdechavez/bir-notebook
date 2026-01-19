import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import type { Transaction } from '@/types/transaction'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

type GeneralLedgerProps = {
  transactions: Transaction[]
}

export function GeneralLedger({ transactions }: GeneralLedgerProps) {
  const calculateAccountTotals = (transactions: Transaction[]) => {
    const totals: Record<
      string,
      { debit: number; credit: number; name: string; code: string }
    > = {}

    transactions.forEach((transaction) => {
      if (transaction.debitAccount) {
        const key = transaction.debitAccount.id
        if (!totals[key]) {
          totals[key] = {
            debit: 0,
            credit: 0,
            name: transaction.debitAccount.name,
            code: transaction.debitAccount.code,
          }
        }
        totals[key].debit += transaction.amount
      }

      if (transaction.creditAccount) {
        const key = transaction.creditAccount.id
        if (!totals[key]) {
          totals[key] = {
            debit: 0,
            credit: 0,
            name: transaction.creditAccount.name,
            code: transaction.creditAccount.code,
          }
        }
        totals[key].credit += transaction.amount
      }
    })

    return totals
  }

  const accountTotals = calculateAccountTotals(transactions)
  const accountsArray = Object.entries(accountTotals).map(([id, data]) => ({
    id,
    ...data,
  }))

  return (
    <Tabs defaultValue="transactions">
      <TabsList>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
      </TabsList>
      <TabsContent value="transactions">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">Account Code</th>
                <th className="text-left p-3">Account Name</th>
                <th className="text-right p-3">Total Debits</th>
                <th className="text-right p-3">Total Credits</th>
                <th className="text-right p-3">Balance</th>
              </tr>
            </thead>
            <tbody>
              {accountsArray.map((account, index) => {
                const balance = account.debit - account.credit
                return (
                  <tr
                    key={account.id}
                    className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="p-3 font-medium">{account.code}</td>
                    <td className="p-3">{account.name}</td>
                    <td className="p-3 text-right font-medium text-green-600">
                      {formatCentsToCurrency(account.debit)}
                    </td>
                    <td className="p-3 text-right font-medium text-red-600">
                      {formatCentsToCurrency(account.credit)}
                    </td>
                    <td
                      className={`p-3 text-right font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatCentsToCurrency(Math.abs(balance))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
                <td colSpan={2} className="p-3 text-right">
                  Grand Totals:
                </td>
                <td className="p-3 text-right text-green-600">
                  {formatCentsToCurrency(
                    accountsArray.reduce((sum, acc) => sum + acc.debit, 0),
                  )}
                </td>
                <td className="p-3 text-right text-red-600">
                  {formatCentsToCurrency(
                    accountsArray.reduce((sum, acc) => sum + acc.credit, 0),
                  )}
                </td>
                <td className="p-3 text-right">
                  {formatCentsToCurrency(
                    Math.abs(
                      accountsArray.reduce((sum, acc) => sum + acc.debit, 0) -
                        accountsArray.reduce((sum, acc) => sum + acc.credit, 0),
                    ),
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </TabsContent>
      <TabsContent value="accounts">
        <ChartOfAccounts />
      </TabsContent>
    </Tabs>
  )
}

function ChartOfAccounts() {
  return <div>Accounts</div>
}
