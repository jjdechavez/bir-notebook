import type { ApiResponse } from "@/lib/api"

export type CorInitInput = {
	filename: string
	mime: "application/pdf" | "image/jpeg" | "image/png" | "image/webp"
	size: number
	taxYear: number
}

export type CorDocument = {
	id: number
	mime: string
	sizeBytes: number
	ocn: string | null
	taxYear: number | null
	status: string
	originalFilename: string | null
	createdAt: string
}

export type ListCorDocuments = ApiResponse<Array<CorDocument>>
