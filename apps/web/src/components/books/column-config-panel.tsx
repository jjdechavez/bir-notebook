import { useSuspenseQuery } from "@tanstack/react-query"
import { useState } from "react"
import { chartOfAccountsOptions } from "@/hooks/api/chart-of-account"
import { COLUMNAR_FIXED_COLUMNS, type ColumnarBookConfig } from "./utils"

interface ColumnConfigPanelProps {
	config: ColumnarBookConfig
	onSave: (config: ColumnarBookConfig) => void
	onCancel: () => void
}

export function ColumnConfigPanel({
	config,
	onSave,
	onCancel,
}: ColumnConfigPanelProps) {
	const { data: accounts } = useSuspenseQuery(
		chartOfAccountsOptions({ limit: 100 }),
	)
	const [columnSize, setColumnSize] = useState<6 | 10 | 14>(config.columnSize)
	const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
		config.columns,
	)

	const maxColumns = columnSize - COLUMNAR_FIXED_COLUMNS

	const handleToggleAccount = (accountCode: string) => {
		if (selectedAccounts.includes(accountCode)) {
			setSelectedAccounts((prev) => prev.filter((c) => c !== accountCode))
		} else {
			if (selectedAccounts.length < maxColumns) {
				setSelectedAccounts((prev) => [...prev, accountCode])
			}
		}
	}

	const handleSave = () => {
		onSave({
			...config,
			columnSize,
			columns: selectedAccounts.slice(0, maxColumns),
		})
	}

	return (
		<div className="bg-info/10 border border-info/30 rounded-lg p-4 mb-6">
			<h3 className="font-semibold mb-3">Configure Columnar Layout</h3>

			<div className="mb-4">
				<label className="block text-sm mb-2">Column Size</label>
				<div className="flex gap-2">
					{[6, 10, 14].map((size) => (
						<button
							key={size}
							type="button"
							onClick={() => {
								setColumnSize(size as 6 | 10 | 14)
								setSelectedAccounts((prev) =>
									prev.slice(0, size - COLUMNAR_FIXED_COLUMNS),
								)
							}}
							className={`px-4 py-2 rounded text-sm ${
								columnSize === size
									? "bg-primary text-primary-foreground"
									: "bg-secondary/70 text-secondary-foreground border border-border"
							}`}
						>
							{size} columns ({size - COLUMNAR_FIXED_COLUMNS} configurable +
							 4 fixed)
						</button>
					))}
				</div>
			</div>

			<div className="mb-4">
				<label className="block text-sm mb-2">
					Select Accounts ({selectedAccounts.length}/{maxColumns} selected)
				</label>
				<div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto bg-card p-3 rounded border border-border">
					{accounts.data.map((account) => {
						const isSelected = selectedAccounts.includes(account.code)
						const isDisabled =
							!isSelected && selectedAccounts.length >= maxColumns
						return (
							<button
								key={account.id}
								onClick={() => handleToggleAccount(account.code)}
								disabled={isDisabled}
								className={`text-left px-3 py-2 rounded text-sm border transition-colors ${
									isSelected
										? "bg-primary-100 border-primary-400 text-primary-900"
										: isDisabled
											? "bg-muted border-border text-muted-foreground cursor-not-allowed"
											: "bg-card border-border text-card-foreground hover:bg-accent/40"
								}`}
							>
								<div className="font-medium">{account.code}</div>
								<div className="text-xs truncate">{account.name}</div>
							</button>
						)
					})}
				</div>
			</div>

			<div className="flex gap-2">
				<button
					onClick={handleSave}
					className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-700 text-sm"
				>
					Apply Configuration
				</button>
				<button
					onClick={onCancel}
					className="px-4 py-2 bg-card text-card-foreground border border-border rounded hover:bg-accent/40 text-sm"
				>
					Cancel
				</button>
			</div>
		</div>
	)
}
