import { createFileRoute } from '@tanstack/react-router'
import { BookOpen, FileText, TrendingDown, TrendingUp } from 'lucide-react'

import { useAuth } from '../../lib/auth'
import { TransactionCard } from '@/components/transaction-summary-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TransactionForm } from '@/components/transaction-form'
import { TransactionList } from '@/components/transaction-list'
import { useQuery } from '@tanstack/react-query'
import { tuyau } from '@/main'
import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'

export const Route = createFileRoute('/(app)/dashboard')({
  component: DashboardComponent,
  loader: () => ({
    crumb: 'Dashboard',
  }),
})

function DashboardComponent() {
  const { user } = useAuth()

  return (
    <div className="bg-background p-6">
      <h1 className="text-xl font-bold mb-4">
        Welcome back, {user?.firstName} {user?.lastName}
      </h1>
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Manage your transactions with BIR-compliant record keeping
        </p>

        <TransactionSummary />
        <TransactionMain />
        <RecentTransactions />
      </div>
    </div>
  )
}

function TransactionSummary() {
  const { data } = useQuery(
    tuyau.api.transactions.summary.$get.queryOptions({}),
  )
  const totalIncome = data?.totalIncome || 0
  const totalExpenses = data?.totalExpenses || 0
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <TransactionCard
        title="Total Income"
        description={formatCentsToCurrency(data?.totalIncome || 0)}
        icon={TrendingUp}
      />
      <TransactionCard
        title="Total Expenses"
        description={formatCentsToCurrency(data?.totalExpenses || 0)}
        icon={TrendingDown}
        variant="expense"
      />
      <TransactionCard
        title="Net Income"
        description={formatCentsToCurrency(data?.netIncome || 0)}
        icon={FileText}
        variant={
          totalIncome > totalExpenses ? 'passiveNetIncome' : 'negativeNetIncome'
        }
      />
      <TransactionCard
        title="Categories"
        description={'PHP 0.00'}
        icon={BookOpen}
        variant="categories"
      />
    </div>
  )
}

function TransactionMain() {
  return (
    <Tabs defaultValue="create" className="space-y-6">
      <TabsList>
        <TabsTrigger value="create">Create Transaction</TabsTrigger>
        <TabsTrigger value="list">Transaction List</TabsTrigger>
      </TabsList>

      <TabsContent value="create">
        <TransactionForm
          onSuccess={() => {
            // Could show a success toast or refresh data
            console.log('Transaction created successfully')
          }}
        />
      </TabsContent>

      <TabsContent value="list">
        <TransactionList />
      </TabsContent>
    </Tabs>
  )
}

function RecentTransactions() {
  return null
}
