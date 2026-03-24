import { Kysely } from "kysely";

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function up(db) {
  const accounts = await db
    .selectFrom("chart_of_accounts")
    .select(["id", "code"])
    .execute();

  const accountMap = new Map(accounts.map((a) => [a.code, a.id]));

  const transactionCategoryBookTypes = {
    cashReceiptJournal: "cash_receipt_journal",
    cashDisbursementJournal: "cash_disbursement_journal",
    generalJournal: "general_journal",
    generalLedger: "general_ledger",
  };

  const categories = [
    // CASH RECEIPTS JOURNAL CATEGORIES
    {
      name: "Sales Income - Cash",
      book_type: transactionCategoryBookTypes.cashReceiptJournal,
      default_debit_account_id: accountMap.get("1101"), // Cash on Hand
      default_credit_account_id: accountMap.get("4101"), // Sales Revenue
    },
    {
      name: "Service Income - Cash",
      book_type: transactionCategoryBookTypes.cashReceiptJournal,
      default_debit_account_id: accountMap.get("1101"), // Cash on Hand
      default_credit_account_id: accountMap.get("4102"), // Service Revenue
    },
    {
      name: "Consulting Fees - Cash",
      book_type: transactionCategoryBookTypes.cashReceiptJournal,
      default_debit_account_id: accountMap.get("1101"), // Cash on Hand
      default_credit_account_id: accountMap.get("4103"), // Consulting Fees
    },
    {
      name: "Professional Fees - Cash",
      book_type: transactionCategoryBookTypes.cashReceiptJournal,
      default_debit_account_id: accountMap.get("1101"), // Cash on Hand
      default_credit_account_id: accountMap.get("4104"), // Professional Fees
    },
    {
      name: "Commission Income - Cash",
      book_type: transactionCategoryBookTypes.cashReceiptJournal,
      default_debit_account_id: accountMap.get("1101"), // Cash on Hand
      default_credit_account_id: accountMap.get("4105"), // Commission Income
    },
    {
      name: "Rental Income - Cash",
      book_type: transactionCategoryBookTypes.cashReceiptJournal,
      default_debit_account_id: accountMap.get("1101"), // Cash on Hand
      default_credit_account_id: accountMap.get("4106"), // Rental Income
    },
    {
      name: "Interest Income - Cash",
      book_type: transactionCategoryBookTypes.cashReceiptJournal,
      default_debit_account_id: accountMap.get("1101"), // Cash on Hand
      default_credit_account_id: accountMap.get("4107"), // Interest Income
    },
    {
      name: "Collection from Receivables",
      book_type: transactionCategoryBookTypes.cashReceiptJournal,
      default_debit_account_id: accountMap.get("1101"), // Cash on Hand
      default_credit_account_id: accountMap.get("1201"), // _account_i Receivable
    },
    {
      name: "Owner's Capital Contribution",
      book_type: transactionCategoryBookTypes.cashReceiptJournal,
      default_debit_account_id: accountMap.get("1101"), // Cash on Hand
      default_credit_account_id: accountMap.get("3101"), // Owner's Capital
    },
    {
      name: "Loan Proceeds Received",
      book_type: transactionCategoryBookTypes.cashReceiptJournal,
      default_debit_account_id: accountMap.get("1101"), // Cash on Hand
      default_credit_account_id: accountMap.get("2201"), // Notes Payable
    },

    // CASH DISBURSEMENTS JOURNAL CATEGORIES
    {
      name: "Office Rent Payment",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("5301"), // Office Rent
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Salaries & Wages Payment",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("5201"), // Salaries & Wages
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Utilities Payment",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("5302"), // Utilities Expense
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Telephone & Internet Payment",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("5303"), // Telephone & Internet
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Office Supplies Purchase",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("5304"), // Office Supplies Expense
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Marketing & Advertising",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("5401"), // Marketing & Advertising
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Travel Expenses",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("5402"), // Travel Expenses
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Meals & Entertainment",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("5403"), // Meals & Entertainment
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Transportation Expenses",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("5404"), // Transportation Expense
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Fuel & Oil Purchase",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("5405"), // Fuel & Oil
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Insurance Payment",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("5501"), // Insurance Expense
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Professional Fees Payment",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("5503"), // Professional Fees
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Training & Development",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("5505"), // Training & Development
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Dues & Subscriptions",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("5506"), // Dues & Subscriptions
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Payment to Suppliers",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("2101"), // _account_i Payable
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Owner's Drawings",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("3102"), // Owner's Drawings
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Loan Payment",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("2201"), // Notes Payable
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Tax Payments",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("2103"), // Taxes Payable
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "VAT Payment",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("2104"), // VAT Payable
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Bank Deposits",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_debit_account_id: accountMap.get("1102"), // Cash in Bank
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Cash Refunds to Customers",
      book_type: transactionCategoryBookTypes.cashDisbursementJournal,
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
      default_debit_account_id: accountMap.get("4101"), // Sales Revenue
    },

    // GENERAL JOURNAL_ CATEGORIES
    {
      name: "Depreciation Expense",
      book_type: "general_journal",
      default_debit_account_id: accountMap.get("5601"), // Depreciation Expense
      default_credit_account_id: accountMap.get("1302"), // Office Equipment (Accumulated Depreciation)
    },
    {
      name: "Amortization Expense",
      book_type: "general_journal",
      default_debit_account_id: accountMap.get("5602"), // Amortization Expense
      default_credit_account_id: accountMap.get("1401"), // Prepaid Rent
    },
    {
      name: "Accrued Expenses",
      book_type: "general_journal",
      default_debit_account_id: accountMap.get("5201"), // Salaries & Wages
      default_credit_account_id: accountMap.get("2102"), // Accrued Expenses
    },
    {
      name: "Prepaid Expenses",
      book_type: "general_journal",
      default_debit_account_id: accountMap.get("1401"), // Prepaid Rent
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
    {
      name: "Bad Debts Expense",
      book_type: "general_journal",
      default_debit_account_id: accountMap.get("5701"), // Bad Debts Expense
      default_credit_account_id: accountMap.get("1201"), // _account_i Receivable
    },
    {
      name: "Year-End Closing",
      book_type: "general_journal",
      default_debit_account_id: accountMap.get("4101"), // Sales Revenue
      default_credit_account_id: accountMap.get("3301"), // Income Summary
    },
    {
      name: "Inventory Adjustments",
      book_type: "general_journal",
      default_debit_account_id: accountMap.get("5101"), // Cost of Goods Sold
      default_credit_account_id: accountMap.get("1301"), // Office Supplies
    },
    {
      name: "Correction of Errors",
      book_type: "general_journal",
      default_debit_account_id: accountMap.get("5803"), // Other Expenses
      default_credit_account_id: accountMap.get("1101"), // Cash on Hand
    },
  ];

  const now = new Date();
  await db
    .insertInto("transaction_categories")
    .values(
      categories.map((category) => ({
        ...category,
        created_at: now,
        updated_at: now,
      })),
    )
    .execute();
}

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
  // Migration code
}
