export type LogLevel = "debug" | "info" | "warn" | "error"

const levelRank: Record<LogLevel, number> = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40,
}

export interface Logger {
	debug: (message: string, meta?: Record<string, unknown>) => void
	info: (message: string, meta?: Record<string, unknown>) => void
	warn: (message: string, meta?: Record<string, unknown>) => void
	error: (message: string, meta?: Record<string, unknown>) => void
}

export function createLogger(
	level: LogLevel,
	context?: Record<string, unknown>,
): Logger {
	const threshold = levelRank[level]

	const log = (
		entryLevel: LogLevel,
		message: string,
		meta?: Record<string, unknown>,
	) => {
		if (levelRank[entryLevel] < threshold) return

		const payload = {
			level: entryLevel,
			message,
			timestamp: new Date().toISOString(),
			...context,
			...(meta ?? {}),
		}

		const output = JSON.stringify(payload)
		if (entryLevel === "error") {
			console.error(output)
			return
		}

		if (entryLevel === "warn") {
			console.warn(output)
			return
		}

		console.log(output)
	}

	return {
		debug: (message, meta) => log("debug", message, meta),
		info: (message, meta) => log("info", message, meta),
		warn: (message, meta) => log("warn", message, meta),
		error: (message, meta) => log("error", message, meta),
	}
}
