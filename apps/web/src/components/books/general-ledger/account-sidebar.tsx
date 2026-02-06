import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import type { TransactionAccount } from '@/types/transaction'
import { useQuery } from '@tanstack/react-query'
import { tuyau } from '@/main'

interface AccountSidebarProps {
  selectedAccountId?: number | null
  onAccountSelect: (accountId: number) => void
  dateFrom?: string
  dateTo?: string
}

interface AccountGroup {
  title: string
  accounts: TransactionAccount[]
  type: string
}

export function AccountSidebar({
  selectedAccountId,
  onAccountSelect,
  dateFrom,
  dateTo,
}: AccountSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: accountsData, status } = useQuery(
    tuyau.api['transaction-accounts'].accounts.$get.queryOptions(),
  )

  const accountGroups = useMemo(() => {
    if (!accountsData?.data) {
      return []
    }

    const accounts = accountsData.data

    const filteredAccounts = searchTerm
      ? accounts.filter(
          (account) =>
            account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.code.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : accounts

    const assetAccounts = filteredAccounts.filter((acc) => acc.type === 'asset')
    const liabilityAccounts = filteredAccounts.filter(
      (acc) => acc.type === 'liability',
    )
    const equityAccounts = filteredAccounts.filter(
      (acc) => acc.type === 'equity',
    )
    const revenueAccounts = filteredAccounts.filter(
      (acc) => acc.type === 'revenue',
    )
    const expenseAccounts = filteredAccounts.filter(
      (acc) => acc.type === 'expense',
    )

    const groups: AccountGroup[] = [
      {
        title: 'ASSETS',
        accounts: assetAccounts.sort((a, b) => a.code.localeCompare(b.code)),
        type: 'asset',
      },
      {
        title: 'LIABILITIES',
        accounts: liabilityAccounts.sort((a, b) =>
          a.code.localeCompare(b.code),
        ),
        type: 'liability',
      },
      {
        title: 'EQUITY',
        accounts: equityAccounts.sort((a, b) => a.code.localeCompare(b.code)),
        type: 'equity',
      },
      {
        title: 'REVENUE',
        accounts: revenueAccounts.sort((a, b) => a.code.localeCompare(b.code)),
        type: 'revenue',
      },
      {
        title: 'EXPENSES',
        accounts: expenseAccounts.sort((a, b) => a.code.localeCompare(b.code)),
        type: 'expense',
      },
    ].filter((group) => group.accounts.length > 0)

    return groups
  }, [accountsData?.data, searchTerm])

  if (status === 'pending') {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 bg-muted/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const totalAccounts = accountGroups.reduce(
    (sum, group) => sum + group.accounts.length,
    0,
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground" />
        <Input
          placeholder="Search accounts by code or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="text-sm text-muted-foreground">
        {totalAccounts} account{totalAccounts !== 1 ? 's' : ''} found
      </div>

      <div className="space-y-4 h-full overflow-y-auto pr-2">
        {accountGroups.map((group) => (
          <Card key={group.title}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{group.title}</span>
                <Badge variant="outline" className="text-xs">
                  {group.accounts.length} accounts
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {group.accounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => onAccountSelect(account.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedAccountId === account.id
                      ? 'bg-accent border-accent'
                      : 'bg-card hover:border-ring'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium">
                          {account.code}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {account.type}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{account.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {accountGroups.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">No accounts found</p>
              <p className="text-sm">
                {searchTerm
                  ? 'No accounts match your search criteria.'
                  : 'No accounts found for the selected date range.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
