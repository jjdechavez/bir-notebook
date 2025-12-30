import vine from '@vinejs/vine'

export const paginateValidator = vine.object({
  page: vine.number().optional(),
  limit: vine.number().optional(),
})
