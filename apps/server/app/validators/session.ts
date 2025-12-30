import vine from '@vinejs/vine'

export const sessionStoreValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string(),
  })
)
