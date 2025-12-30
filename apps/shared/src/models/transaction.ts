export const transactionCategoryBookTypes = {
  cashReceiptJournal: "cash_receipt_journal",
  cashDisbursementJournal: "cash_disbursement_journal",
  generalJournal: "general_journal",
  generalLedger: "general_ledger",
} as const;

export type TransactionCategoryBookType =
  (typeof transactionCategoryBookTypes)[keyof typeof transactionCategoryBookTypes];
