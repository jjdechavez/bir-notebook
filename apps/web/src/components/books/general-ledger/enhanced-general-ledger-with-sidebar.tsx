import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { AccountSidebar } from './account-sidebar'
import { EnhancedGeneralLedgerAccountView } from './enhanced-general-ledger-account-view'
import type { TransactionSearch } from '@/types/transaction'

interface EnhancedGeneralLedgerWithSidebarProps {
  dateFrom?: string
  dateTo?: string
  onTransferClick?: () => void
  onExportClick?: () => void
}

export function EnhancedGeneralLedgerWithSidebar({
  dateFrom,
  dateTo,
  onTransferClick,
  onExportClick,
}: EnhancedGeneralLedgerWithSidebarProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null,
  )
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const handleAccountSelect = (accountId: number) => {
    setSelectedAccountId(accountId)
    // Auto-collapse sidebar on mobile after selection
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  const handleClearSelection = () => {
    setSelectedAccountId(null)
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar - 35% */}
      <div
        className={`${isSidebarOpen ? 'w-1/3' : 'w-0'} transition-all duration-300 overflow-hidden`}
      >
        <div className="max-w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Accounts</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
                disabled={!selectedAccountId}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden"
              >
                {isSidebarOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <AccountSidebar
            selectedAccountId={selectedAccountId}
            onAccountSelect={handleAccountSelect}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </div>
      </div>

      {/* Main Content - 65% */}
      <div className="flex-1 min-w-0">
        {selectedAccountId ? (
          <div className="space-y-4">
            {/* Account Header with Back Button */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAccountId(null)}
                className="mb-4"
              >
                ← Back to Accounts
              </Button>
              {onTransferClick && (
                <Button onClick={onTransferClick} className="mb-4">
                  Transfer to GL
                </Button>
              )}
              {onExportClick && (
                <Button
                  variant="outline"
                  onClick={onExportClick}
                  className="mb-4"
                >
                  Export
                </Button>
              )}
            </div>

            {/* General Ledger View */}
            <div className="border-l-2 border-blue-200 pl-4">
              <EnhancedGeneralLedgerAccountView
                accountId={selectedAccountId}
                filters={{ dateFrom, dateTo } as TransactionSearch}
                onTransferClick={onTransferClick}
              />
            </div>
          </div>
        ) : (
          /* Empty State when no account selected */
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-3xl text-gray-400">📊</div>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Select an Account to View
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Choose an account from the sidebar to view its General Ledger
                  entries. Accounts are grouped by type (Assets, Liabilities,
                  Equity, Revenue, Expenses) and ordered alphabetically by
                  account code.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Sidebar Toggle */}
        {!isSidebarOpen && selectedAccountId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden fixed bottom-4 right-4 z-10"
          >
            <Menu className="h-4 w-4" />
            Show Accounts
          </Button>
        )}
      </div>
    </div>
  )
}
