import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { AccountSidebar } from './account-sidebar'
import { EnhancedGeneralLedgerAccountView } from './enhanced-general-ledger-account-view'
import type { TransactionSearch } from '@/types/transaction'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'

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
  const isMobile = useIsMobile()
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null,
  )
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile)

  const handleAccountSelect = (accountId: number) => {
    setSelectedAccountId(accountId)
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }

  const handleClearSelection = () => {
    setSelectedAccountId(null)
  }

  const handleBackToAccounts = () => {
    setSelectedAccountId(null)
    if (isMobile) {
      setIsSidebarOpen(true) // Open sheet on mobile
    } else if (!isSidebarOpen) {
      setIsSidebarOpen(true) // Open sidebar on desktop if collapsed
    }
  }

  return (
    <div className="flex gap-2 md:gap-6 h-full">
      {/* Mobile Accounts Button and Sheet */}
      {isMobile && (
        <div className="mb-4">
          {/* Smart visibility Accounts button */}
          {(!isSidebarOpen || selectedAccountId) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-4 w-4 mr-2" />
              Accounts
            </Button>
          )}

          {/* Sheet overlay - always present but controlled by state */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent
              side="left"
              className="w-3/4 sm:max-w-sm overflow-y-auto"
            >
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
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
                    {onTransferClick && (
                      <Button onClick={onTransferClick} size="sm">
                        Transfer to GL
                      </Button>
                    )}
                  </div>
                </div>

                <AccountSidebar
                  selectedAccountId={selectedAccountId}
                  onAccountSelect={handleAccountSelect}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div
          className={`${isSidebarOpen ? 'w-1/3' : 'w-0'} transition-all duration-300 overflow-hidden`}
        >
          <div className="max-w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
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
                {onTransferClick && (
                  <Button onClick={onTransferClick} size="sm">
                    Transfer to GL
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="hidden md:flex"
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
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {selectedAccountId ? (
          <div className="space-y-4">
            {/* Header with Back and Export buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToAccounts}
                className="mb-0"
              >
                ← Back to Accounts
              </Button>
              {onExportClick && (
                <Button
                  variant="outline"
                  onClick={onExportClick}
                  className="mb-0"
                >
                  Export
                </Button>
              )}
            </div>

            <div className="border-l-2 border-blue-200 pl-4">
              <EnhancedGeneralLedgerAccountView
                accountId={selectedAccountId}
                filters={{ dateFrom, dateTo } as TransactionSearch}
              />
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 md:py-16">
              <div className="text-center">
                <div className="mx-auto w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-2xl md:text-3xl text-gray-400">📊</div>
                </div>
                <h3 className="text-base md:text-lg font-semibold mb-2">
                  Select an Account to View
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto text-sm md:text-base">
                  Choose an account from the sidebar to view its General Ledger
                  entries. Accounts are grouped by type (Assets, Liabilities,
                  Equity, Revenue, Expenses) and ordered alphabetically by
                  account code.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Desktop floating button for collapsed sidebar */}
        {!isMobile && !isSidebarOpen && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarOpen(true)}
            className="fixed bottom-4 right-4 z-10 hidden md:flex"
          >
            <Menu className="h-4 w-4 mr-2" />
            Show Accounts
          </Button>
        )}
      </div>
    </div>
  )
}
