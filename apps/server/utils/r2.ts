import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

function getR2Client(): S3Client {
	const accountId = process.env["R2_ACCOUNT_ID"] ?? ""
	const accessKeyId = process.env["R2_ACCESS_KEY_ID"] ?? ""
	const secretAccessKey = process.env["R2_SECRET_ACCESS_KEY"] ?? ""
	return new S3Client({
		region: "auto",
		endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
		credentials: { accessKeyId, secretAccessKey },
		// Avoid SDK-added checksum headers (x-amz-checksum-crc32) on presigned
		// URLs: browsers would have to send them back and list them in CORS
		// preflights. Checksums are unnecessary for small COR scans.
		requestChecksumCalculation: "WHEN_REQUIRED",
		responseChecksumValidation: "WHEN_REQUIRED",
	})
}

export function getR2Bucket(): string {
	return process.env["R2_BUCKET"] ?? "bir-notebook-docs"
}

export function isR2Configured(): boolean {
	return Boolean(
		process.env["R2_ACCOUNT_ID"] &&
			process.env["R2_ACCESS_KEY_ID"] &&
			process.env["R2_SECRET_ACCESS_KEY"],
	)
}

/**
 * Key scheme (no PII in filename):
 * cor/{userId}/{taxYear}/original/{docId}.{ext}
 * cor/{userId}/{taxYear}/display/{docId}_1600.jpg
 * cor/{userId}/{taxYear}/extracted/{docId}.json
 */
export function buildCorKeys(
	userId: string,
	taxYear: number,
	docId: string,
	ext: string,
): { original: string; display: string; json: string } {
	const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, "_")
	const safeDoc = docId.replace(/[^a-zA-Z0-9_-]/g, "_")
	const cleanExt = ext.replace(/^\./, "").toLowerCase() || "pdf"
	return {
		original: `cor/${safeUser}/${taxYear}/original/${safeDoc}.${cleanExt}`,
		display: `cor/${safeUser}/${taxYear}/display/${safeDoc}_1600.jpg`,
		json: `cor/${safeUser}/${taxYear}/extracted/${safeDoc}.json`,
	}
}

export async function presignPut(
	key: string,
	contentType: string,
	expiresIn = 300,
): Promise<string> {
	const client = getR2Client()
	const cmd = new PutObjectCommand({
		Bucket: getR2Bucket(),
		Key: key,
		ContentType: contentType,
	})
	return getSignedUrl(client, cmd, { expiresIn })
}

export async function presignGet(
	key: string,
	expiresIn = 900,
): Promise<string> {
	const client = getR2Client()
	const cmd = new GetObjectCommand({ Bucket: getR2Bucket(), Key: key })
	return getSignedUrl(client, cmd, { expiresIn })
}

export async function r2PutBuffer(
	key: string,
	body: Buffer,
	contentType: string,
): Promise<void> {
	const client = getR2Client()
	await client.send(
		new PutObjectCommand({
			Bucket: getR2Bucket(),
			Key: key,
			Body: body,
			ContentType: contentType,
		}),
	)
}

export async function r2PutJson(key: string, data: unknown): Promise<void> {
	const client = getR2Client()
	await client.send(
		new PutObjectCommand({
			Bucket: getR2Bucket(),
			Key: key,
			Body: Buffer.from(JSON.stringify(data, null, 2)),
			ContentType: "application/json",
		}),
	)
}

export async function r2GetBuffer(key: string): Promise<Buffer> {
	const client = getR2Client()
	const res = await client.send(
		new GetObjectCommand({ Bucket: getR2Bucket(), Key: key }),
	)
	const body = res.Body as unknown as AsyncIterable<Uint8Array>
	const chunks: Buffer[] = []
	for await (const chunk of body) {
		chunks.push(Buffer.from(chunk))
	}
	return Buffer.concat(chunks)
}

export async function r2Delete(key: string): Promise<void> {
	const client = getR2Client()
	await client.send(
		new DeleteObjectCommand({ Bucket: getR2Bucket(), Key: key }),
	)
}
