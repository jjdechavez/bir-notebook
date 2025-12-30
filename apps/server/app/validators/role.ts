import vine from '@vinejs/vine'
import { paginateValidator } from './common.js'

export const roleListValidator = vine.compile(
  vine.object({
    ...paginateValidator.getProperties(),
    s: vine.string().optional(),
  })
)
