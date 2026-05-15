import { useEffect, useMemo, useState } from "react"
import {
	COLUMNAR_FIXED_COLUMNS,
	defaultColumnarConfigs,
	type ColumnarBookConfig,
	type ColumnarBookType,
	type ColumnSize,
} from "@/components/books/utils"

const STORAGE_KEY_PREFIX = "columnar-config"
const VALID_COLUMN_SIZES: ColumnSize[] = [6, 10, 14]

const isColumnSize = (value: unknown): value is ColumnSize =>
	VALID_COLUMN_SIZES.includes(value as ColumnSize)

const sanitizeConfig = (
	bookType: ColumnarBookType,
	config: Partial<ColumnarBookConfig> | null | undefined,
): ColumnarBookConfig => {
	const fallback = defaultColumnarConfigs[bookType]
	const columnSize = isColumnSize(config?.columnSize)
		? config.columnSize
		: fallback.columnSize
	const maxColumns = columnSize - COLUMNAR_FIXED_COLUMNS
	const columns = Array.from(new Set(config?.columns ?? fallback.columns)).slice(
		0,
		maxColumns,
	)

	return {
		bookType,
		columnSize,
		columns,
	}
}

export const useColumnarBookConfig = (bookType: ColumnarBookType) => {
	const storageKey = useMemo(() => `${STORAGE_KEY_PREFIX}:${bookType}`, [bookType])
	const [config, setConfigState] = useState<ColumnarBookConfig>(() =>
		sanitizeConfig(bookType, defaultColumnarConfigs[bookType]),
	)
	const [isEditing, setIsEditing] = useState(false)

	useEffect(() => {
		if (typeof window === "undefined") return
		const raw = window.localStorage.getItem(storageKey)
		if (!raw) {
			setConfigState(sanitizeConfig(bookType, defaultColumnarConfigs[bookType]))
			return
		}

		try {
			const parsed = JSON.parse(raw) as Partial<ColumnarBookConfig>
			setConfigState(sanitizeConfig(bookType, parsed))
		} catch {
			setConfigState(sanitizeConfig(bookType, defaultColumnarConfigs[bookType]))
		}
	}, [bookType, storageKey])

	const setConfig = (nextConfig: ColumnarBookConfig) => {
		const sanitized = sanitizeConfig(bookType, nextConfig)
		setConfigState(sanitized)
		if (typeof window !== "undefined") {
			window.localStorage.setItem(storageKey, JSON.stringify(sanitized))
		}
	}

	return {
		config,
		setConfig,
		isEditing,
		openPanel: () => setIsEditing(true),
		closePanel: () => setIsEditing(false),
	}
}
