import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function fromSnakeCaseToCamelCase(str: string) {
	return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
	? `${T}${Capitalize<SnakeToCamel<U>>}`
	: S

type CamelKeys<T> = {
	[K in keyof T as K extends string ? SnakeToCamel<K> : K]: T[K] extends object
		? CamelKeys<T[K]>
		: T[K]
}

export function camelKeys<T extends Record<string, unknown>>(
	obj: T,
): CamelKeys<T>
export function camelKeys(obj: unknown): unknown
export function camelKeys(obj: unknown): unknown {
	if (obj == null) return obj
	if (Array.isArray(obj)) return obj.map((v) => camelKeys(v))
	if (typeof obj === "object" && obj.constructor === Object) {
		return Object.keys(obj as object).reduce(
			(result, key) => {
				result[fromSnakeCaseToCamelCase(key)] = camelKeys(
					(obj as Record<string, unknown>)[key],
				)
				return result
			},
			{} as Record<string, unknown>,
		)
	}
	return obj
}
