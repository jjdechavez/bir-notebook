/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const SessionController = () => import('#controllers/session_controller')
const HealthChecksController = () => import('#controllers/health_checks_controller')
const UsersController = () => import('#controllers/users_controller')
const InvitesController = () => import('#controllers/invites_controller')
const RolesController = () => import('#controllers/roles_controller')
const AccountsController = () => import('#controllers/accounts_controller')
const TransactionsController = () => import('#controllers/transactions_controller')
const TransactionCategoriesController = () =>
  import('#controllers/transaction_categories_controller')
const TransactionAccountsController = () => import('#controllers/transaction_accounts_controller')

router.get('/health', [HealthChecksController])
router.post('/api/session', [SessionController, 'store'])

router.get('/api/invites/:id', [InvitesController, 'show'])
router.post('/api/invites/:id/complete', [InvitesController, 'complete'])
router.get('/invites/:id/confirm', [InvitesController, 'confirm']).as('invites.confirm')

router
  .group(() => {
    router
      .group(() => {
        router.delete('/', [SessionController, 'destroy'])
        router.get('/', [SessionController, 'me'])
      })
      .prefix('/session')

    router
      .group(() => {
        router.get('/', [UsersController, 'index'])
        router.put('/:id', [UsersController, 'update'])
      })
      .prefix('/users')

    router
      .group(() => {
        router.get('/', [RolesController, 'index'])
      })
      .prefix('/roles')

    router
      .group(() => {
        router.post('/', [InvitesController, 'store'])
        router.get('/', [InvitesController, 'index'])
        router.put('/:id', [InvitesController, 'update'])
        router.get('/:id/generate', [InvitesController, 'generateLink'])
      })
      .prefix('/invites')

    router
      .group(() => {
        router.put('/', [AccountsController, 'update'])
        router.post('/passwords', [AccountsController, 'changePassword'])
      })
      .prefix('/accounts')

    router
      .group(() => {
        router.get('/', [TransactionsController, 'index'])
        router.post('/', [TransactionsController, 'store'])
        router.get('/summary', [TransactionsController, 'summary'])

        router.get('/:id', [TransactionsController, 'show'])
        router.put('/:id', [TransactionsController, 'update'])
        router.post('/:id/record', [TransactionsController, 'recordTransaction'])
        router.post('/:id/record/undo', [TransactionsController, 'undoRecordTransaction'])
      })
      .prefix('/transactions')

    router
      .group(() => {
        router.get('/', [TransactionCategoriesController, 'all'])
        router.get('/:id', [TransactionCategoriesController, 'getDefaultAccounts'])
      })
      .prefix('/transaction-categories')

    router
      .group(() => {
        router.get('/', [TransactionAccountsController, 'all'])
        router.get('/accounts', [TransactionAccountsController, 'currentChartOfAccounts'])
      })
      .prefix('/transaction-accounts')
  })
  .prefix('/api')
  .middleware([middleware.auth({ guards: ['api'] }), middleware.bouncer()])
