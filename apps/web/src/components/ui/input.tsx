import * as React from "react"
import { useDebouncedCallback } from "use-debounce"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "./input-group"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
				"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
				className,
			)}
			{...props}
		/>
	)
}

function DebounceInput({
	value: initialValue,
	className,
	debounce = 1000,
	onChange,
	...props
}: Omit<React.ComponentProps<"input">, "onChange"> & {
	debounce?: number
	onChange: (value: string | number) => void
}) {
	const [value, setValue] = React.useState(initialValue)
	const debounced = useDebouncedCallback((value) => onChange(value), debounce)

	React.useEffect(() => {
		setValue(initialValue)
	}, [initialValue])

	return (
		<Input
			className={cn(className)}
			value={value}
			onChange={(e) => {
				if (e.target.value === "") {
					setValue("")
					return debounced("")
				}
				if (props.type === "number") {
					setValue(e.target.valueAsNumber)
					debounced(e.target.valueAsNumber)
				} else {
					setValue(e.target.value)
					debounced(e.target.value)
				}
			}}
			{...props}
		/>
	)
}

function PasswordInput({ className, ...props }: React.ComponentProps<"input">) {
	const [showPasswordText, setShowPasswordText] = React.useState(false)
	return (
		<InputGroup>
			<InputGroupInput
				{...props}
				type={showPasswordText ? "text" : "password"}
				className={cn(className)}
			/>
			<InputGroupAddon align="inline-end">
				<InputGroupButton
					onClick={() => setShowPasswordText((prev) => !prev)}
					size="icon-xs"
				>
					{showPasswordText ? <EyeIcon /> : <EyeOffIcon />}
					<span className="sr-only">Show password</span>
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	)
}

export { Input, DebounceInput, PasswordInput }
