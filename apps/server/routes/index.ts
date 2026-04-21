import { createRouter, useBase } from "h3"
import { changePassword, updateAccount } from "../handlers/accounts.js"
import authHandler from "../handlers/auth.js"
import healthHandler from "../handlers/health.js"
import {
	completeInviteHandler,
	confirmInviteHandler,
	createInviteHandler,
	generateInviteLinkHandler,
	listInvitesHandler,
	showInviteHandler,
	updateInviteHandler,
} from "../handlers/invites.js"
import readyHandler from "../handlers/ready.js"
import { listRolesHandler } from "../handlers/roles.js"
import {
	createSession,
	destroySession,
	getSession,
} from "../handlers/session.js"
import { systemHasBeenSetup } from "../handlers/setup.js"
import {
	currentChartOfAccounts,
	listChartOfAccounts,
} from "../handlers/transaction-accounts.js"
import {
	getTransactionCategoryDefaults,
	listTransactionCategories,
} from "../handlers/transaction-categories.js"
import {
	bulkRecordTransactionHandler,
	bulkTransferToGeneralLedgerHandler,
	bulkUndoRecordTransactionHandler,
	createTransactionHandler,
	generalLedgerViewHandler,
	listTransactions,
	recordTransactionHandler,
	showTransaction,
	summaryTransactions,
	transferHistoryHandler,
	transferToGeneralLedgerHandler,
	undoRecordTransactionHandler,
	updateGlDescriptionHandler,
	updateTransactionHandler,
	validateTransferEligibilityHandler,
} from "../handlers/transactions.js"
import {
	getUserPreferences,
	updateUserPreferences,
} from "../handlers/user-preferences.js"
import { listUsersHandler, updateUserHandler } from "../handlers/users.js"

export function createApiRouter() {
	const router = createRouter()

	const apiRouter = createRouter()

	router.get("/health", healthHandler)
	router.get("/invites/:id/confirm", confirmInviteHandler)

	apiRouter.get("/health", healthHandler)
	apiRouter.get("/ready", readyHandler)
	apiRouter.post("/session", createSession)
	apiRouter.get("/session", getSession)
	apiRouter.delete("/session", destroySession)
	apiRouter.get("/invites/:id", showInviteHandler)
	apiRouter.post("/invites/:id/complete", completeInviteHandler)
	apiRouter.use("/auth/**", authHandler)

	apiRouter.get("/users", listUsersHandler)
	apiRouter.put("/users/:id", updateUserHandler)

	apiRouter.get("/roles", listRolesHandler)

	apiRouter.post("/invites", createInviteHandler)
	apiRouter.get("/invites", listInvitesHandler)
	apiRouter.put("/invites/:id", updateInviteHandler)
	apiRouter.get("/invites/:id/generate", generateInviteLinkHandler)

	apiRouter.put("/accounts", updateAccount)
	apiRouter.post("/accounts/passwords", changePassword)

	apiRouter.get("/transactions", listTransactions)
	apiRouter.post("/transactions", createTransactionHandler)
	apiRouter.get("/transactions/summary", summaryTransactions)
	apiRouter.post("/transactions/record/bulk", bulkRecordTransactionHandler)
	apiRouter.post(
		"/transactions/record/undo/bulk",
		bulkUndoRecordTransactionHandler,
	)
	apiRouter.post(
		"/transactions/transfer-to-general-ledger",
		transferToGeneralLedgerHandler,
	)
	apiRouter.post(
		"/transactions/transfer-to-general-ledger/bulk",
		bulkTransferToGeneralLedgerHandler,
	)
	apiRouter.post(
		"/transactions/transfer/validate",
		validateTransferEligibilityHandler,
	)
	apiRouter.get("/transactions/transfer-history", transferHistoryHandler)
	apiRouter.get("/transactions/general-ledger/view", generalLedgerViewHandler)
	apiRouter.put(
		"/transactions/gl/:id/update-description",
		updateGlDescriptionHandler,
	)
	apiRouter.get("/transactions/:id", showTransaction)
	apiRouter.put("/transactions/:id", updateTransactionHandler)
	apiRouter.post("/transactions/:id/record", recordTransactionHandler)
	apiRouter.post("/transactions/:id/record/undo", undoRecordTransactionHandler)

	apiRouter.get("/transaction-categories", listTransactionCategories)
	apiRouter.get("/transaction-categories/:id", getTransactionCategoryDefaults)

	apiRouter.get("/chart-of-accounts", listChartOfAccounts)
	apiRouter.get("/chart-of-accounts/accounts", currentChartOfAccounts)

	apiRouter.get("/preferences", getUserPreferences)
	apiRouter.put("/preferences", updateUserPreferences)

	apiRouter.get("/setup", systemHasBeenSetup)

	router.use("/api/**", useBase("/api", apiRouter.handler))

	return router
}
