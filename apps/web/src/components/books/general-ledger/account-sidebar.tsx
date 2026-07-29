import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useCurrentChartOfAccounts } from "@/hooks/api/chart-of-account";
import type { ChartOfAccount } from "@/types/transaction";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

interface AccountSidebarProps {
  selectedAccountId?: number | null;
  onAccountSelect: (accountId: number) => void;
  dateFrom?: string;
  dateTo?: string;
}

interface AccountGroup {
  title: string;
  accounts: ChartOfAccount[];
  type: string;
}

export function AccountSidebar({
  selectedAccountId,
  onAccountSelect,
  // _dateFrom,
  // dateTo,
}: AccountSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: accountsData, status } = useCurrentChartOfAccounts();

  const accountGroups = useMemo(() => {
    if (!accountsData?.data) {
      return [];
    }

    const accounts = accountsData.data;

    const filteredAccounts = searchTerm
      ? accounts.filter(
          (account) =>
            account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.code.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : accounts;

    const assetAccounts = filteredAccounts.filter(
      (acc) => acc.type === "asset",
    );
    const liabilityAccounts = filteredAccounts.filter(
      (acc) => acc.type === "liability",
    );
    const equityAccounts = filteredAccounts.filter(
      (acc) => acc.type === "equity",
    );
    const revenueAccounts = filteredAccounts.filter(
      (acc) => acc.type === "revenue",
    );
    const expenseAccounts = filteredAccounts.filter(
      (acc) => acc.type === "expense",
    );

    const groups: AccountGroup[] = [
      {
        title: "ASSETS",
        accounts: assetAccounts.sort((a, b) => a.code.localeCompare(b.code)),
        type: "asset",
      },
      {
        title: "LIABILITIES",
        accounts: liabilityAccounts.sort((a, b) =>
          a.code.localeCompare(b.code),
        ),
        type: "liability",
      },
      {
        title: "EQUITY",
        accounts: equityAccounts.sort((a, b) => a.code.localeCompare(b.code)),
        type: "equity",
      },
      {
        title: "REVENUE",
        accounts: revenueAccounts.sort((a, b) => a.code.localeCompare(b.code)),
        type: "revenue",
      },
      {
        title: "EXPENSES",
        accounts: expenseAccounts.sort((a, b) => a.code.localeCompare(b.code)),
        type: "expense",
      },
    ].filter((group) => group.accounts.length > 0);

    return groups;
  }, [accountsData?.data, searchTerm]);

  if (status === "pending") {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 rounded-md bg-muted" />
        {["a", "b", "c", "d", "e"].map((key) => (
          <div key={key} className="h-12 rounded-md bg-muted/60" />
        ))}
      </div>
    );
  }

  const totalAccounts = accountGroups.reduce(
    (sum, group) => sum + group.accounts.length,
    0,
  );

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 space-y-2 pb-2">
        <InputGroup>
          <InputGroupAddon>
            <Search className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by code or name"
            aria-label="Search accounts by code or name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-10"
          />
        </InputGroup>
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>
            {totalAccounts} account{totalAccounts !== 1 ? "s" : ""}
          </span>
          {searchTerm && (
            <button
              type="button"
              className="font-medium text-foreground hover:underline"
              onClick={() => setSearchTerm("")}
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[calc(100vh-15rem)] space-y-5 overflow-y-auto pr-1">
        {accountGroups.map((group) => (
          <div key={group.title}>
            <div className="mb-1 flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>{group.title}</span>
              <span className="font-normal">{group.accounts.length}</span>
            </div>
            <div className="space-y-1">
              {group.accounts.map((account) => {
                const isSelected = selectedAccountId === account.id;
                return (
                  <button
                    key={account.id}
                    type="button"
                    aria-current={isSelected ? "true" : undefined}
                    onClick={() => onAccountSelect(account.id)}
                    className={`flex w-full items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-left transition-colors ${isSelected ? "border-primary bg-accent text-foreground" : "border-transparent hover:bg-muted/70"}`}
                  >
                    <span className="w-12 shrink-0 font-mono text-xs font-semibold text-muted-foreground">
                      {account.code}
                    </span>
                    <span className="min-w-0 truncate text-sm font-medium">
                      {account.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {accountGroups.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
          <p className="font-medium text-foreground">No matching accounts</p>
          <p className="mt-1 text-sm">Try another account code or name.</p>
          {searchTerm && (
            <button
              type="button"
              className="mt-3 text-sm font-medium text-primary hover:underline"
              onClick={() => setSearchTerm("")}
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
}
