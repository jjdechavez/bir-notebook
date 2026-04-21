import { getQuery, getRequestURL } from "h3"
import { requireAuth } from "../middleware/auth.js"
import { roleListSchema } from "../validators/role.js"
import { serializeRole } from "../serializers/role.js"
import { buildPaginationMeta } from "../utils/pagination.js"
import type { Selectable } from "kysely"
import type { Roles } from "../db/types.js"

export const listRolesHandler = requireAuth(async (event) => {
	const payload = roleListSchema.parse(getQuery(event))
	const page = payload.page ?? 1
	const limit = payload.limit ?? 10
	const offset = (page - 1) * limit
	const search = payload.s ?? ""

	let base = event.context.db.selectFrom("roles")
	if (search) {
		base = base.where("name", "ilike", `%${search}%`)
	}

	const totalResult = await base
		.select((eb) => eb.fn.count<number>("id").as("total"))
		.executeTakeFirst()
	const total = Number(totalResult?.total ?? 0)

	let rolesQuery = event.context.db.selectFrom("roles").selectAll()

	if (search.length > 0) {
		rolesQuery = rolesQuery.where("name", "ilike", `%${search}%`)
	}

	const roles: Array<Selectable<Roles>> = await rolesQuery
		.limit(limit)
		.offset(offset)
		.execute()

	const url = getRequestURL(event)
	const baseUrl = `${url.origin}${url.pathname}`

	return {
		data: roles.map((role) => serializeRole(role as any)),
		meta: buildPaginationMeta(total, limit, page, baseUrl),
	}
})
