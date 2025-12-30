import vine from '@vinejs/vine'

export const createInviteValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .unique(async (db, value) => {
        const exist = await db.from('users').where('email', value).first()
        return exist ? false : true
      }),
    roleId: vine.number().exists(async (db, value) => {
      const exist = await db.from('roles').where('id', value).first()
      return !!exist
    }),
  })
)

export const completeInviteValidator = vine.compile(
  vine.object({
    firstName: vine.string().maxLength(180),
    lastName: vine.string().maxLength(180),
    password: vine
      .string()
      .minLength(8)
      .regex(/(?=.*\d)/) //  'The password must contain at least one number.'
      .confirmed(),
  })
)

export const updateInviteValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .unique(async (db, value, field) => {
        const exist = await db
          .from('invites')
          .where('email', value)
          .andWhereNot('id', field.meta.inviteId)
          .first()
        return exist ? false : true
      }),
    roleId: vine.number().exists(async (db, value) => {
      const exist = await db.from('roles').where('id', value).first()
      return !!exist
    }),
  })
)
