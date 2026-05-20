# BIR Notebook

BIR Notebook is a bookkeeping web app built for freelancers and small service-based businesses in the Philippines.  
Its main purpose is to simplify daily transaction recording while staying aligned with BIR Books of Accounts requirements.

## Project Purpose

BIR Notebook is designed to achieve three core goals:

1. **BIR Compliance First**  
   Prioritize required Books of Accounts:
   - Cash Receipts Journal
   - Cash Disbursements Journal
   - General Journal
   - General Ledger
2. **Human Error Prevention**  
   Reduce common mistakes such as spelling issues, wrong amounts, and incorrect account mapping.
3. **Freelancer-Friendly Workflow**  
   Keep bookkeeping simple for freelancers who need fast transaction recording, not complex inventory systems.

## What the Project Solves

Many freelancers struggle with manual bookkeeping and compliance formatting.  
BIR Notebook helps by giving users a structured, guided way to encode transactions and automatically organize them into the correct BIR books.

## Current Features

### Core Accounting (Phase 1)
- ✅ **BIR-compliant Chart of Accounts** through the `Accounts` table
- ✅ **Transaction categories** with default debit/credit account assignments
- ✅ **Immutable transaction records** for audit trail integrity
- ✅ **Responsive transaction form** with real-time entry preview
- ✅ **Smart categorization + double-entry bookkeeping** support

### Books Visualization (Phase 2)

Available in `/books` with separate tabs per book:
- **Cash Receipts Journal** — income transactions
- **Cash Disbursements Journal** — expense transactions
- **General Journal** — non-cash adjustments/corrections
- **General Ledger** — account-by-account summary

#### Columnar Book Layout

To replicate actual columnar books, each book can be configured based on how many columns are needed:
- **6 columns** = 4 user-defined columns + `Sundry` + `Sundry Amount`
- **10 columns** = 8 user-defined columns + `Sundry` + `Sundry Amount`
- **14 columns** = 12 user-defined columns + `Sundry` + `Sundry Amount`

Rule:
- The last two columns are always reserved for `Sundry` and `Sundry Amount`.

#### Books Features

- **Date range filtering** (From/To)
- **Search and filtering** by description, reference, or amount
- **Recording status indicator** to quickly see if a transaction is already posted in the selected book
- **Status labels**: `Recorded` (posted to book) and `Not Recorded` (not yet posted)
- **Filter by status** to review pending or unposted transactions faster
- **Bulk record/unrecord actions** to update status for multiple transactions in one step
- **Posting validation before transfer** so only `Recorded` transactions can be transferred to `General Ledger`
- **Transfer comment options**: one shared comment for all selected records, or separate comments per transaction group
- **Transfer audit trace** to log who transferred records, when, and which transactions were included
- **Real-time totals** for debit/credit balances per book
- **Export options**
  - PDF (BIR-ready format) (TODO)
  - Excel/CSV (backup and analysis) (TODO)
- **Mobile-responsive** layout for desktop and mobile use
- **Print-ready formatting** for physical records

#### Transfer to General Ledger Workflow

To keep books accurate, only transactions marked as `Recorded` can be transferred to `General Ledger`.

1. Select one or multiple transactions from source books (Cash Receipts Journal, Cash Disbursements Journal, or General Journal).
2. Use **Bulk Record** when needed to mark selected entries as `Recorded`.
3. Run transfer validation:
   - If any selected entry is `Not Recorded`, transfer is blocked.
   - The system prompts the user to record pending entries first.
4. Choose comment mode for transfer:
   - **Single comment mode**: apply one comment to all selected transactions.
   - **Grouped comment mode**: assign separate comments for each transaction group.
5. Confirm transfer to `General Ledger`.
6. Save transfer log details for traceability (transaction set, comment mode, timestamp, and user action).

Result:
- Only validated, recorded transactions appear in `General Ledger`.
- Comments improve audit readability for grouped or batch postings.

### Auto Book Assignment

```ts
const bookTypes = [
  'cash_receipt_journal',       // Income transactions
  'cash_disbursement_journal',  // Expense transactions
  'general_journal',            // Adjustments/Corrections
  'general_ledger'              // Account summaries
]
```

## Example flow:
- Sales Income → Cash Receipts Journal
- Office Rent → Cash Disbursements Journal
- Depreciation → General Journal

### Future Enhancements (Phase 3)
- Optional Inventory module (only if users need it)
- Advanced reports:
  - Income Statement
  - Balance Sheet

## Deployment Flow
1. Push to main → build and push images
2. Create tag v* → trigger release workflow
3. Deploy tagged images to production
4. Track version through environment configuration

## Tech Stack
- Backend: H3
- Frontend: React SPA + TanStack Router
- Database: PostgreSQL
- Web server: Nginx
- Containerization: Docker / Docker Compose
