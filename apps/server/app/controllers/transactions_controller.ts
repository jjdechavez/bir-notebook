import { TransactionService } from '#services/transaction_service'
import { GeneralLedgerService } from '#services/general_ledger_service'
import {
  bulkRecordTransactionValidator,
  createTransactionValidator,
  transactionListValidator,
  updateTransactionValidator,
  transferToGeneralLedgerValidator,
  bulkTransferToGeneralLedgerValidator,
  generalLedgerViewValidator,
  transferHistoryValidator,
} from '#validators/transaction'
import TransactionDto from '#dtos/transaction'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import Transaction from '#models/transaction'

@inject()
export default class TransactionsController {
  constructor(
    protected transactionService: TransactionService,
    protected generalLedgerService: GeneralLedgerService
  ) {}

  async index({ request, auth }: HttpContext) {
    const userId = auth.user!.id
    const {
      page = 1,
      limit = 10,
      ...filters
    } = await request.validateUsing(transactionListValidator)
    const result = await this.transactionService.paginate(page, limit, { ...filters, userId })

    return TransactionDto.fromPaginator(result)
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
        data: new TransactionDto(result.data),
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
      data: new TransactionDto(transaction),
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
      data: new TransactionDto(result.data),
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
      data: new TransactionDto(result.data),
      message: result.message,
    }
  }

  async undoRecordTransaction({ params, response }: HttpContext) {
    const result = await this.transactionService.undoRecordTransaction(params.id)

    if (result.status === 'not_found') {
      return response.notFound({ message: result.message })
    }

    return {
      data: new TransactionDto(result.data),
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

  async transferToGeneralLedger({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(transferToGeneralLedgerValidator)

    const result = await this.generalLedgerService.transferToGeneralLedger(
      payload.transactionIds,
      payload.targetMonth,
      payload.glDescription,
      auth.user!.id
    )

    if (result.status === 'error') {
      return response.internalServerError({
        status: result.status,
        errors: result.errors,
        message: 'Transfer failed',
      })
    }

    return response.ok({
      status: result.status,
      data: result.result,
      message: `Successfully transferred ${result.result?.totalTransactions} transactions to ${result.result?.totalGroups} GL group(s)`,
    })
  }

  async bulkTransferToGeneralLedger({ request, auth }: HttpContext) {
    const payload = await request.validateUsing(bulkTransferToGeneralLedgerValidator)

    const results = await Promise.allSettled(
      payload.transfers.map((transfer) =>
        this.generalLedgerService.transferToGeneralLedger(
          transfer.transactionIds,
          transfer.targetMonth,
          transfer.glDescription,
          auth.user!.id
        )
      )
    )

    const successful = results.filter((r) => r.status === 'fulfilled')
    const failed = results.filter((r) => r.status === 'rejected')

    return {
      status: failed.length === 0 ? 'success' : 'partial',
      message: `Processed ${payload.transfers.length} transfer groups. ${successful.length} successful, ${failed.length} failed.`,
      summary: {
        totalGroups: payload.transfers.length,
        successful: successful.length,
        failed: failed.length,
        results: successful.map((r) => (r as PromiseFulfilledResult<any>).value.result),
      },
    }
  }

  async validateTransferEligibility({ request, auth }: HttpContext) {
    const { transactionIds } = await request.validateUsing(bulkRecordTransactionValidator)

    const result = await this.generalLedgerService.validateTransferEligibility(
      transactionIds,
      auth.user!.id
    )

    return {
      isValid: result.isValid,
      eligibleTransactions: result.eligibleTransactions,
      ineligibleTransactions: result.ineligibleTransactions,
      errors: result.errors,
      warnings: result.warnings,
    }
  }

  async getTransferHistory({ request, auth }: HttpContext) {
    const payload = await request.validateUsing(transferHistoryValidator)

    const history = await this.generalLedgerService.getTransferHistory(
      auth.user!.id,
      payload.transferGroupId
    )

    return {
      data: history,
    }
  }

  async getGeneralLedgerView({ request, auth }: HttpContext) {
    const payload = await request.validateUsing(generalLedgerViewValidator)

    const ledgerView = await this.generalLedgerService.getGeneralLedgerView(
      payload.accountId,
      payload.dateFrom,
      payload.dateTo,
      auth.user!.id
    )

    return {
      data: ledgerView,
    }
  }

  async updateGlDescription({ params, request, auth, response }: HttpContext) {
    try {
      const { description } = request.only(['description'])

      if (!description || description.trim().length === 0) {
        return response.badRequest({
          message: 'Description is required',
        })
      }

      if (description.length > 255) {
        return response.badRequest({
          message: 'Description must be less than 255 characters',
        })
      }

      // Find the parent GL transaction
      const glTransaction = await Transaction.query()
        .where('id', params.id)
        .where('userId', auth.user!.id)
        .where('bookType', 'general_ledger')
        .whereNull('glId') // Parent GL only
        .first()

      if (!glTransaction) {
        return response.notFound({
          message: 'GL transaction not found',
        })
      }

      // Update the description
      glTransaction.description = description.trim()
      await glTransaction.save()

      return {
        message: 'GL transaction description updated successfully',
        data: {
          id: glTransaction.id,
          description: glTransaction.description,
        },
      }
    } catch (error) {
      return response.badRequest({
        message: 'Failed to update GL transaction description',
      })
    }
  }
}
