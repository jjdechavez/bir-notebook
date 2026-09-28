import {
	type TaxPayerType,
	taxPayerOptions,
} from "@bir-notebook/shared/models/cor"
import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from "@tanstack/react-form"
import { z } from "zod"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select"

const dateSchema = (label: string) =>
	z
		.string()
		.refine(
			(v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v),
			`${label} must use YYYY-MM-DD`,
		)

export const corDetailsSchema = z.object({
	tin: z
		.string()
		.regex(/^\d{3}-\d{3}-\d{3}$/, "TIN must look like 123-456-789"),
	branchCode: z.string().regex(/^\d{5}$/, "Branch code must be 5 digits"),
	rdoCode: z.string().min(1, "RDO code is required"),
	taxpayerName: z.string().min(1, "Registered name is required"),
	registeredAddress: z.string().min(1, "Registered address is required"),
	registrationDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Registration date must use YYYY-MM-DD"),
	tinIssuanceDate: dateSchema("TIN issuance date"),
	tradeName: z.string(),
	psic: z.string(),
	lineOfBusiness: z.string(),
	ocn: z.string(),
	taxpayerType: z.enum([
		"single_proprietor",
		"professional",
		"mixed",
		"opc",
		"corp",
		"other",
	]),
	is8Pct: z.boolean(),
})

export type CorDetailsFormData = z.infer<typeof corDetailsSchema>

const { fieldContext, formContext } = createFormHookContexts()

const { useAppForm: useCorDetailsAppForm, withForm } = createFormHook({
	fieldComponents: {},
	formComponents: {},
	fieldContext,
	formContext,
})

export { useCorDetailsAppForm }

export const corDetailsFormOpts = formOptions({
	defaultValues: {
		tin: "",
		branchCode: "00000",
		rdoCode: "",
		taxpayerName: "",
		registeredAddress: "",
		registrationDate: "",
		tinIssuanceDate: "",
		tradeName: "",
		psic: "",
		lineOfBusiness: "",
		ocn: "",
		taxpayerType: "professional",
		is8Pct: true,
	} as CorDetailsFormData,
	validators: {
		onSubmit: corDetailsSchema,
	},
})

const TEXT_FIELDS = {
	tin: { name: "tin", label: "TIN (XXX-XXX-XXX)", placeholder: "363-814-811" },
	branch: { name: "branchCode", label: "Branch code", placeholder: "00000" },
	rdo: { name: "rdoCode", label: "RDO code", placeholder: "54B" },
	taxPayer: { name: "taxpayerName", label: "Registered name" },
	taxPayerType: { name: "taxpayerType", label: "Tax Payer Type" },
	registeredAddress: { name: "registeredAddress", label: "Registered address" },
	registrationDate: {
		name: "registrationDate",
		label: "Registration date (YYYY-MM-DD)",
	},
	tinIssuanceDate: {
		name: "tinIssuanceDate",
		label: "TIN issuance date (YYYY-MM-DD)",
	},
	tradeName: { name: "tradeName", label: "Trade name" },
	psic: { name: "psic", label: "PSIC code" },
	lineOfBusiness: { name: "lineOfBusiness", label: "Line of business" },
} as const

export const CorDetailsForm = withForm({
	...corDetailsFormOpts,
	render: ({ form }) => {
		return (
			<div className="space-y-4">
				<div className="grid grid-cols-4 gap-4 items-center">
					<form.Field name={TEXT_FIELDS.tin.name}>
						{(field) => (
							<Field
								data-invalid={field.state.meta.errors.length > 0}
								className="col-span-2"
							>
								<FieldLabel htmlFor={field.name}>
									{TEXT_FIELDS.tin.label}
								</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									placeholder={TEXT_FIELDS.tin.placeholder}
									value={field.state.value as string}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
								/>
								{field.state.meta.errors.length > 0 && (
									<FieldError errors={field.state.meta.errors} />
								)}
							</Field>
						)}
					</form.Field>
					<form.Field name={TEXT_FIELDS.branch.name}>
						{(field) => (
							<Field
								data-invalid={field.state.meta.errors.length > 0}
								className="col-span-2"
							>
								<FieldLabel htmlFor={field.name}>
									{TEXT_FIELDS.branch.label}
								</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									placeholder={TEXT_FIELDS.branch.placeholder}
									value={field.state.value as string}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
								/>
								{field.state.meta.errors.length > 0 && (
									<FieldError errors={field.state.meta.errors} />
								)}
							</Field>
						)}
					</form.Field>
				</div>

				<form.Field name={TEXT_FIELDS.tinIssuanceDate.name}>
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>
								{TEXT_FIELDS.tinIssuanceDate.label}
							</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value as string}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
							/>
							{field.state.meta.errors.length > 0 && (
								<FieldError errors={field.state.meta.errors} />
							)}
						</Field>
					)}
				</form.Field>

				<form.Field name={TEXT_FIELDS.taxPayerType.name}>
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>
								{TEXT_FIELDS.taxPayerType.label}
							</FieldLabel>
							<Select
								name={field.name}
								value={field.state.value as string}
								onValueChange={(e) => field.handleChange(e as TaxPayerType)}
							>
								<SelectTrigger
									aria-invalid={field.state.meta.errors.length > 0}
								>
									<SelectValue placeholder="Select" />
								</SelectTrigger>
								<SelectContent>
									{taxPayerOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{field.state.meta.errors.length > 0 && (
								<FieldError errors={field.state.meta.errors} />
							)}
						</Field>
					)}
				</form.Field>

				<form.Field name={TEXT_FIELDS.taxPayer.name}>
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>
								{TEXT_FIELDS.taxPayer.label}
							</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value as string}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
							/>
							{field.state.meta.errors.length > 0 && (
								<FieldError errors={field.state.meta.errors} />
							)}
						</Field>
					)}
				</form.Field>

				<form.Field name={TEXT_FIELDS.registeredAddress.name}>
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>
								{TEXT_FIELDS.registeredAddress.label}
							</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value as string}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
							/>
							{field.state.meta.errors.length > 0 && (
								<FieldError errors={field.state.meta.errors} />
							)}
						</Field>
					)}
				</form.Field>

				<form.Field name="is8Pct">
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>8% income tax rate</FieldLabel>
							<div className="flex items-center gap-2 text-sm">
								<input
									id={field.name}
									name={field.name}
									type="checkbox"
									checked={field.state.value as boolean}
									onChange={(e) => field.handleChange(e.target.checked)}
									onBlur={field.handleBlur}
								/>
								<span>Availed 8% this year (no 2551Q needed)</span>
							</div>
							{field.state.meta.errors.length > 0 && (
								<FieldError errors={field.state.meta.errors} />
							)}
						</Field>
					)}
				</form.Field>

				<form.Field name={TEXT_FIELDS.registrationDate.name}>
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>
								{TEXT_FIELDS.registrationDate.label}
							</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value as string}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
							/>
							{field.state.meta.errors.length > 0 && (
								<FieldError errors={field.state.meta.errors} />
							)}
						</Field>
					)}
				</form.Field>

				<form.Field name={TEXT_FIELDS.tradeName.name}>
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>
								{TEXT_FIELDS.tradeName.label}
							</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value as string}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
							/>
							{field.state.meta.errors.length > 0 && (
								<FieldError errors={field.state.meta.errors} />
							)}
						</Field>
					)}
				</form.Field>

				<div className="grid grid-cols-4 gap-4 items-center">
					<form.Field name={TEXT_FIELDS.psic.name}>
						{(field) => (
							<Field
								data-invalid={field.state.meta.errors.length > 0}
								className="col-span-2"
							>
								<FieldLabel htmlFor={field.name}>
									{TEXT_FIELDS.psic.label}
								</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value as string}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
								/>
								{field.state.meta.errors.length > 0 && (
									<FieldError errors={field.state.meta.errors} />
								)}
							</Field>
						)}
					</form.Field>

					<form.Field name={TEXT_FIELDS.lineOfBusiness.name}>
						{(field) => (
							<Field
								data-invalid={field.state.meta.errors.length > 0}
								className="col-span-2"
							>
								<FieldLabel htmlFor={field.name}>
									{TEXT_FIELDS.lineOfBusiness.label}
								</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value as string}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
								/>
								{field.state.meta.errors.length > 0 && (
									<FieldError errors={field.state.meta.errors} />
								)}
							</Field>
						)}
					</form.Field>
				</div>
			</div>
		)
	},
})

type ExtractedBlob = Record<string, unknown>

function asString(v: unknown): string {
	if (typeof v === "string") return v
	if (typeof v === "number") return String(v)
	return ""
}

/** Map the camelCased extract blob onto form values (unknown keys ignored). */
export function corDetailsFromExtracted(
	raw: ExtractedBlob,
): CorDetailsFormData {
	console.log("corsDetail from raw: ", raw)
	const taxpayerType = asString(raw["taxpayerType"])
	const allowedTypes = [
		"single_proprietor",
		"professional",
		"mixed",
		"opc",
		"corp",
		"other",
	] as const
	return {
		tin: asString(raw["tin"]),
		branchCode: asString(raw["branchCode"]) || "00000",
		rdoCode: asString(raw["rdoCode"]),
		taxpayerName: asString(raw["taxpayerName"]),
		registeredAddress: asString(raw["registeredAddress"]),
		registrationDate: asString(raw["registrationDate"]),
		tinIssuanceDate: asString(raw["tinIssuanceDate"]),
		tradeName: asString(raw["tradeName"]),
		psic: asString(raw["psic"]),
		lineOfBusiness: asString(raw["lineOfBusiness"]),
		ocn: asString(raw["ocn"]),
		taxpayerType: (allowedTypes as readonly string[]).includes(taxpayerType)
			? (taxpayerType as CorDetailsFormData["taxpayerType"])
			: "professional",
		is8Pct: typeof raw["is8Pct"] === "boolean" ? raw["is8Pct"] : true,
	}
}

export type CorObligationInput = {
	tax_type: string
	form_type: string
	start_date: string
	frequency: "MONTHLY" | "QUARTERLY" | "ANNUALLY"
}

/**
 * Single client→server boundary: camelCase form values become the
 * snake_case confirm contract (including nested obligations).
 */
export function toConfirmPayload(
	docId: number,
	values: CorDetailsFormData,
	obligations: ExtractedBlob[] | undefined,
	registrationFallback = "2025-11-07",
) {
	const freq = (v: unknown): CorObligationInput["frequency"] =>
		v === "MONTHLY" || v === "ANNUALLY" ? v : "QUARTERLY"
	const mapped: CorObligationInput[] =
		obligations?.map((o) => ({
			tax_type: asString(o["taxType"] ?? o["tax_type"]),
			form_type: asString(o["formType"] ?? o["form_type"]),
			start_date: asString(o["startDate"] ?? o["start_date"]),
			frequency: freq(o["frequency"]),
		})) ?? []
	const finalObligations =
		mapped.length > 0
			? mapped
			: [
					{
						tax_type: "INDIVIDUAL INCOME TAX",
						form_type: "1701Q",
						start_date: values.registrationDate || registrationFallback,
						frequency: "QUARTERLY",
					},
					{
						tax_type: "INDIVIDUAL INCOME TAX",
						form_type: "1701A",
						start_date: "2026-01-01",
						frequency: "ANNUALLY",
					},
				]

	return {
		docId,
		tin: values.tin,
		branch_code: values.branchCode || "00000",
		rdo_code: values.rdoCode,
		taxpayer_type: values.taxpayerType,
		atc: "II017",
		registered_name: values.taxpayerName,
		registered_address: values.registeredAddress,
		registration_date: values.registrationDate,
		tin_issuance_date: values.tinIssuanceDate || null,
		is_8pct: values.is8Pct,
		eight_pct_year: 2026,
		trade_name: values.tradeName || null,
		psic: values.psic || null,
		line_of_business: values.lineOfBusiness || null,
		ocn: values.ocn || null,
		obligations: finalObligations,
	}
}

/**
 * Fill the form field-by-field after AI extraction. Uses `setFieldValue`
 * per mounted field (which notifies the field instance directly) instead of
 * a bulk `form.reset(values)`, which does not reliably reach rendered
 * inputs in this setup. Returns the count of non-empty filled fields.
 */
export function applyExtractedToForm(
	setField: (name: keyof CorDetailsFormData, value: string | boolean) => void,
	raw: ExtractedBlob,
): number {
	const mapped = corDetailsFromExtracted(raw)
	let filled = 0
	const keys = Object.keys(mapped) as Array<keyof CorDetailsFormData>
	for (const key of keys) {
		const value = mapped[key]
		setField(key, value)
		// Count only values the AI actually returned (not mapper defaults).
		const source = raw[key]
		if (typeof source === "string" ? source !== "" : source != null) {
			filled += 1
		}
	}
	return filled
}
