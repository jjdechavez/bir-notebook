import { TransactionCategoryDto } from '#dto/transaction'
import TransactionCategory from '#models/transaction_category'
import type { HttpContext } from '@adonisjs/core/http'

export default class TransactionCategoriesController {
  async all({}: HttpContext) {
    const categories = await TransactionCategory.query().whereNull('deleted_at').orderBy('name')

    return {
      data: categories.map((category) => new TransactionCategoryDto(category).toJson()),
    }
  }

  async getDefaultAccounts({ params, response }: HttpContext) {
    const category = await TransactionCategory.find(params.id)

    if (!category) {
      return response.notFound({
        message: 'Transaction category not found',
      })
    }

    return {
      debitAccountId: category.defaultDebitAccountId,
      creditAccountId: category.defaultCreditAccountId,
      bookType: category.bookType,
    }
  }
}
