import TransactionCategoryDto from '#dtos/transaction_category'
import TransactionCategory from '#models/transaction_category'
import { transactionCategoryQueryValidator } from '#validators/transaction'
import type { HttpContext } from '@adonisjs/core/http'

export default class TransactionCategoriesController {
  async all({ request }: HttpContext) {
    const {
      page = 1,
      limit = 10,
      s = '',
    } = await request.validateUsing(transactionCategoryQueryValidator)

    const categories = await TransactionCategory.query()
      .if(s.length > 0, (query) => {
        query.whereILike('name', `%${s}%`)
      })
      .whereNull('deleted_at')
      .orderBy('name')
      .debug(true)
      .paginate(page, limit)

    return TransactionCategoryDto.fromPaginator(categories)
  }

  async getDefaultAccounts({ params, response }: HttpContext) {
    const category = await TransactionCategory.find(params.id)

    if (!category) {
      return response.notFound({
        message: 'Transaction category not found',
      })
    }

    return new TransactionCategoryDto(category)
  }
}
