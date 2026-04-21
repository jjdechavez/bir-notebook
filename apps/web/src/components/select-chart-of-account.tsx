import { useEffect, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import type { ChartOfAccount } from "@/types/transaction"
import { useChartOfAccounts } from "@/hooks/api/chart-of-account"

interface SelectChartOfAccountProps {
	value?: number | null
	onChange?: (item: ChartOfAccount | null) => void
	placeholder?: string
}

export function SelectChartOfAccount({
	value,
	onChange,
	placeholder = "Select account...",
}: SelectChartOfAccountProps) {
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState("")
	const [debouncedSearch, setDebouncedSearch] = useState("")

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300)
		return () => clearTimeout(timer)
	}, [search])

	const payload = {
		s: debouncedSearch,
		limit: 100,
	}

	const { data } = useChartOfAccounts(payload)

	const accounts: ChartOfAccount[] = data?.data || []
	const selected = accounts.find((account) => account.id === value)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="justify-between"
				>
					{selected ? `${selected.code} - ${selected.name}` : placeholder}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="p-0" align="start">
				<Command>
					<CommandInput
						placeholder="Search account..."
						value={search}
						onValueChange={setSearch}
					/>
					<CommandEmpty>No chart of account.</CommandEmpty>
					<CommandGroup>
						{accounts.map((account) => (
							<CommandItem
								key={account.id}
								value={account.name}
								onSelect={() => {
									onChange?.(account)
									setOpen(false)
								}}
							>
								<Check
									className={cn(
										"mr-2 h-4 w-4",
										value === account.id ? "opacity-100" : "opacity-0",
									)}
								/>
								{account.code} - {account.name}
							</CommandItem>
						))}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
