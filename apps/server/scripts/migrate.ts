import { loadAppConfig } from "../config.js"
import { closeDb, getDb } from "../db/index.js"
import { createMigrator } from "../db/migrator.js"

async function run(): Promise<void> {
	const config = await loadAppConfig()
	const db = getDb(config)
	const migrator = createMigrator(db)
	const direction = process.argv[2] ?? "latest"

	if (direction !== "latest" && direction !== "down") {
		console.error("Usage: pnpm -C apps/api migrate [latest|down]")
		process.exit(1)
	}

	const result =
		direction === "down"
			? await migrator.migrateDown()
			: await migrator.migrateToLatest()

	if (result.results?.length) {
		for (const item of result.results) {
			const status = item.status.padEnd(9, " ")
			console.log(`${status} ${item.migrationName}`)
		}
	}

	if (result.error) {
		console.error("Migration failed:", result.error)
		process.exitCode = 1
	}

	await closeDb()
}

run().catch((error) => {
	console.error("Migration failed:", error)
	process.exit(1)
})
