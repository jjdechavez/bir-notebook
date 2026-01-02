export const transactionCategoryBookTypes = {
  cashReceiptJournal: "cash_receipt_journal",
  cashDisbursementJournal: "cash_disbursement_journal",
  generalJournal: "general_journal",
  generalLedger: "general_ledger",
} as const;

export type TransactionCategoryBookType =
  (typeof transactionCategoryBookTypes)[keyof typeof transactionCategoryBookTypes];

export const transactionCategoryBookTypeOptions = [
  {
    value: transactionCategoryBookTypes.cashReceiptJournal,
    label: "Cash Receipts Journal",
  },
  {
    value: transactionCategoryBookTypes.cashDisbursementJournal,
    label: "Cash Disbursement Journal",
  },
  {
    value: transactionCategoryBookTypes.generalJournal,
    label: "General Journal",
  },
  {
    value: transactionCategoryBookTypes.generalLedger,
    label: "General Ledger",
  },
] as const;

export const transactionVatTypes = {
  vatExempt: "vat_exempt",
  vatZero: "vat_zero",
  vatStandard: "vat_standard",
} as const;

export type TransactionVatType =
  (typeof transactionVatTypes)[keyof typeof transactionVatTypes];

export const transactionVatTypeOptions = [
  { value: transactionVatTypes.vatExempt, label: "VAT Exempt" },
  { value: transactionVatTypes.vatZero, label: "VAT Zero" },
  { value: transactionVatTypes.vatStandard, label: "VAT Standard" },
] as const;

export function calculateVatAmount(
  amount: number,
  vatType: TransactionVatType,
) {
  let vat = 0;
  if (vatType === "vat_standard") {
    vat = amount * 0.12;
  }

  return vat;
}
