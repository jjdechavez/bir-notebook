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

#### Books Features

- **Date range filtering** (From/To)
- **Search and filtering** by description, reference, or amount
- **Real-time totals** for debit/credit balances per book
- **Export options**
  - PDF (BIR-ready format) (TODO)
  - Excel/CSV (backup and analysis) (TODO)
- **Mobile-responsive** layout for desktop and mobile use
- **Print-ready formatting** for physical records

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
