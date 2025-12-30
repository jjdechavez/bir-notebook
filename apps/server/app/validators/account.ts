import vine from '@vinejs/vine'

export const updateAccountValidator = vine.compile(
  vine.object({
    firstName: vine.string().maxLength(180).optional(),
    lastName: vine.string().maxLength(180).optional(),
  })
)

export const changePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string(),
    newPassword: vine
      .string()
      .minLength(8)
      .regex(/(?=.*\d)/) //  'The password must contain at least one number.'
      .confirmed(),
  })
)
