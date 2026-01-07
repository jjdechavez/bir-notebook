# Overview

Goals:
1. BIR Priority: Books of Accounts (Cash Receipts, Cash Disbursements, Journal, Ledger) are mandatory
2. Human Error Prevention: Your main concern is spelling errors and wrong amounts in transaction recording
3. Freelancer Sharing: Most freelancers need simple transaction recording, not complex inventory

## Phase 1 (Core Feature):
- ✅ Accounts table with BIR-compliant Chart of Accounts
- ✅ TransactionCategories table with default account assignments
- ✅ Transactions table with immutable records for audit trail
- ✅ Responsive transaction form with real-time preview
- ✅ Smart categorization and double-entry bookkeeping

## Phase 2 (Books Visualization):
### Books of Accounts Display (`/books`)
- **Tabbed Interface**: Each BIR book in separate tab
  - Cash Receipts Journal - All income transactions
  - Cash Disbursements Journal - All expense transactions  
  - General Journal - Non-cash adjustments and corrections
  - General Ledger - Account-by-account summary
- **Column Layout**: Each BIR book column layout. User's can visualize depending on column size (every last column should be sundry and sundry amount).
  - Cash Receipts Journal
    - Column Layout: Date | Description | Reference | Debit Cash | Credit Chart of Accounts | Credit Sundry | Credit Sundry Amount
    - Counted on Columns are Reference, Debit Cash, Credit (chart of accounts) (depending on select column size) | Credit Sundry | Credit Sundry Amount
  - Cash Disbursements Journal
    - Column Layout: Date | Description | Reference | Credit Cash | Debit Chart of Accounts | Debit Sundry | Debit Sundry Amount
    - Counted on Columns are Reference, Credit Cash, Debit (chart of accounts) (depending on select column size) | Debit Sundry | Debit Sundry Amount
  - General Journal
    - Column Layout: Date | Description (1st row: chart of account (either debit or credit); 2nd row(tab/indent): chart of account(opposite credit or debit depending on 1st row) 3rd row(two tab/indent): description) | Debit | Credit
    - Counted on Columns: no feature for visualize size columns
  - General Ledger - Account-by-account summary
    - Counted on Columns: no feature for visualize size columns

### Features:
- **Date Range Filtering**: From/To date selectors for period selection
- **Search & Filter**: By description, reference number, or amount
- **Real-time Totals**: Auto-calculated debits/credits per book
- **Export Options**: 
  - PDF (BIR submission format)
  - Excel (CSV backup format)
- **Mobile Responsive**: Optimized for all screen sizes

### BIR Compliance Display:
```typescript
// Book Type Assignment
const bookTypes = [
  'cash_receipt_journal',     // Income transactions
  'cash_disbursement_journal', // Expense transactions
  'general_journal',   // Adjustments/Corrections
  'general_ledger'            // Account summaries
]

// Example Transaction Flow
Sales Income → Auto-assigned to Cash Receipts Journal
Office Rent → Auto-assigned to Cash Disbursements Journal
Depreciation → Auto-assigned to General Journal
```

### Export Formats:
- **PDF**: BIR-ready format with totals, headers, and compliance notes
- **Excel**: CSV format for data backup and analysis
- **Print-ready**: Proper margins and BIR book layout

## Phase 3 (Future Enhancement):
- Add Inventory tables if users request it
- Can be separate module
- Advanced reporting (Income Statement, Balance Sheet)

## Technical Implementation:
- **Responsive Design**: Desktop (side-by-side) vs Mobile (drawer/tabs)
- **Error Prevention**: Form validation, preview before submission
- **Audit Trail**: Immutable transactions with user tracking
- **Real-time Updates**: React Query for cache management
