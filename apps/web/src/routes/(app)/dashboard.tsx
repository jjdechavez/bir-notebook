import { createFileRoute } from '@tanstack/react-router'
import { BookOpen, FileText, TrendingDown, TrendingUp } from 'lucide-react'

import { useAuth } from '../../lib/auth'
import { TransactionCard } from '@/components/transaction-summary-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TransactionForm } from '@/components/transaction-form'
import { TransactionList } from '@/components/transaction-list'

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
        <p className="text-gray-500">
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <TransactionCard
        title="Total Income"
        description={'PHP 0.00'}
        icon={TrendingUp}
      />
      <TransactionCard
        title="Total Expenses"
        description={'PHP 0.00'}
        icon={TrendingDown}
        variant="expense"
      />
      <TransactionCard
        title="Net Income"
        description={'PHP 0.00'}
        icon={FileText}
        variant={0 > 0 ? 'passiveNetIncome' : 'negativeNetIncome'}
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
