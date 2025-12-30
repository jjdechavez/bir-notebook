export const transactionCategoryBookTypes = {
  cashReceiptJournal: "cash_receipt_journal",
  cashDisbursementJournal: "cash_disbursement_journal",
  generalJournal: "general_journal",
  generalLedger: "general_ledger",
} as const;

export type TransactionCategoryBookType =
  (typeof transactionCategoryBookTypes)[keyof typeof transactionCategoryBookTypes];

export const transactionVatTypes = {
  vatExempt: "vat_exempt",
  vatZero: "vat_zero",
  vatStandard: "vat_standard",
} as const;

export type TransactionVatType =
  (typeof transactionVatTypes)[keyof typeof transactionVatTypes];
