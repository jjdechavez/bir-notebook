import { userRoleOptions } from "@bir-notebook/shared/models/user"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select"

type SimpleSelectRoleProps = {
	name: string
	value: string
	handleChange: (value: string) => void
	invalid?: boolean
	placeholder?: string
}

export function SimpleSelectRole(props: SimpleSelectRoleProps) {
	return (
		<Select
			name={props.name}
			value={props.value}
			onValueChange={props.handleChange}
		>
			<SelectTrigger id={props.name} aria-invalid={props?.invalid || false}>
				<SelectValue placeholder={props?.placeholder || "Select role"} />
			</SelectTrigger>
			<SelectContent>
				{userRoleOptions.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
