import path from "path"
import { promises as fs } from "fs"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rawName = process.argv[2]

if (!rawName) {
	console.error("Please provide a name for the migration.")
	process.exit(1)
}

const name = rawName.trim().replace(/\s+/g, "-")

if (!name) {
	console.error("Please provide a non-empty migration name.")
	process.exit(1)
}

const timestamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0]
const fileName = `${timestamp}_${name}.mjs`
const migrationsDir = path.resolve(__dirname, "../db/migrations")
const filePath = path.join(migrationsDir, fileName)

const fileContent = `import { Kysely } from "kysely";

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function up(db) {
  // Migration code
}

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
  // Migration code
}
`

try {
	await fs.mkdir(migrationsDir, { recursive: true })
	await fs.writeFile(filePath, fileContent, { flag: "wx" })
	console.log(`File ${fileName} created successfully at ${filePath}`)
} catch (error) {
	if (error instanceof Error && "code" in error && error.code === "EEXIST") {
		console.error(`File already exists: ${filePath}`)
	} else {
		console.error("Error creating file:", error)
	}
	process.exit(1)
}
