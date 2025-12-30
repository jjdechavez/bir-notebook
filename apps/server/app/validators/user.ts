import vine from '@vinejs/vine'

export const userListValidator = vine.compile(
  vine.object({
    page: vine.number().optional(),
    limit: vine.number().optional(),
  })
)

export const updateUserValidator = vine.compile(
  vine.object({
    firstName: vine.string().maxLength(180).optional(),
    lastName: vine.string().maxLength(180).optional(),
    roleId: vine.number().exists(async (db, value) => {
      const exist = await db.from('roles').where('id', value).first()
      return !!exist
    }),
  })
)
