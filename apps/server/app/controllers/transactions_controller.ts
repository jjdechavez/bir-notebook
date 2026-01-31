import { PaginateDto } from '#dto/paginate'
import { TransactionService } from '#services/transaction_service'
import {
  bulkRecordTransactionValidator,
  createTransactionValidator,
  transactionListValidator,
  updateTransactionValidator,
} from '#validators/transaction'
import { TransactionDto } from '#dto/transaction'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import Transaction from '#models/transaction'

@inject()
export default class TransactionsController {
  constructor(protected transactionService: TransactionService) {}

  async index({ request, auth }: HttpContext) {
    const userId = auth.user!.id
    const {
      page = 1,
      limit = 10,
      ...filters
    } = await request.validateUsing(transactionListValidator)
    const result = await this.transactionService.paginate(page, limit, { ...filters, userId })
    const resultJson = result.toJSON()

    return {
      data: resultJson.data.map((transaction) =>
        new TransactionDto(transaction as Transaction).toJson()
      ),
      meta: new PaginateDto(resultJson.meta).metaToJson(),
    }
  }

  async store({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(createTransactionValidator)
      const result = await this.transactionService.createTransaction({
        ...payload,
        userId: auth.user!.id,
      })

      if (result.status === 'not_found') {
        return response.notFound({ message: result.message })
      }

      if (result.status === 'bad_request') {
        return response.badRequest({ message: result.message })
      }

      return {
        data: new TransactionDto(result.data).toJson(),
        message: 'Transaction created successfully',
      }
    } catch (error) {
      return response.badRequest({
        message: error.message || 'Failed to create transaction',
      })
    }
  }

  async show({ params, response, auth }: HttpContext) {
    const transaction = await this.transactionService.findById(params.id, { userId: auth.user!.id })

    if (!transaction) {
      return response.notFound({
        message: 'Transaction not found',
      })
    }

    return {
      data: new TransactionDto(transaction).toJson(),
    }
  }

  async summary({ auth }: HttpContext) {
    return await this.transactionService.summary(auth.user!.id)
  }

  async update({ request, params, response }: HttpContext) {
    const payload = await request.validateUsing(updateTransactionValidator)
    const result = await this.transactionService.updateTransaction(params.id, payload)

    if (result.status === 'not_found') {
      return response.notFound({ message: result.message })
    }

    if (result.status === 'bad_request') {
      return response.notFound({ message: result.message })
    }

    return {
      data: new TransactionDto(result.data).toJson(),
      message: 'Transaction updated successfully',
    }
  }

  async chartOfAccounts({ auth }: HttpContext) {
    const result = await this.transactionService.getUsedChartOfAccounts(auth.user!.id)
    return result
  }

  async recordTransaction({ params, response }: HttpContext) {
    const result = await this.transactionService.recordTransaction(params.id)

    if (result.status === 'not_found') {
      return response.notFound({ message: result.message })
    }

    return {
      data: new TransactionDto(result.data).toJson(),
      message: result.message,
    }
  }

  async undoRecordTransaction({ params, response }: HttpContext) {
    const result = await this.transactionService.undoRecordTransaction(params.id)

    if (result.status === 'not_found') {
      return response.notFound({ message: result.message })
    }

    return {
      data: new TransactionDto(result.data).toJson(),
      message: result.message,
    }
  }

  async bulkRecordTransaction({ request }: HttpContext) {
    const payload = await request.validateUsing(bulkRecordTransactionValidator)

    const result = await this.transactionService.bulkRecordTransactions(payload.transactionIds)

    return {
      status: result.status,
      data: result.summary,
      message: result.message,
    }
  }

  async bulkUndoRecordTransaction({ request }: HttpContext) {
    const payload = await request.validateUsing(bulkRecordTransactionValidator)

    const result = await this.transactionService.bulkUndoRecordTransactions(payload.transactionIds)

    return {
      status: result.status,
      data: result.summary,
      message: result.message,
    }
  }
}
