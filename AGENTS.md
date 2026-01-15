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

## DevOps Architecture:
- **Container Registry**: GitHub Container Registry (GHCR) for image management
- **CI/CD Pipeline**: GitHub Actions with automated build and deployment
- **Tag-based Releases**: Semantic versioning with `v*` tags for production
- **Multi-environment Support**: 
  - Production: Tagged releases (v1.0.0, v1.0.1, etc.)
  - Staging: `latest` tag (TODO - planned feature)
- **Zero-downtime Deployment**: Rolling updates via Docker Compose
- **Optimized Docker Builds**: Multi-stage builds with production-only dependencies
- **Container Security**: Non-root users, minimal attack surfaces
- **Health Monitoring**: Built-in health checks for all services

### Deployment Workflow:
1. **Development**: Push to feature branches → Build validation only
2. **Production**: Create tag `v*` → Build & push images → Deploy to Hetzner
3. **Staging**: Push to main branch → Update `latest` tag → Deploy (TODO)

### Docker Optimization Strategy:
- **Server Dockerfile**: 4-stage build (base → builder → extract → runner)
  - Production isolation via `pnpm deploy` command
  - 70%+ image size reduction (673MB → ~200MB)
  - Optimized for AdonisJS v6 and Node.js 22
- **Web Dockerfile**: 2-stage build (builder → runner)
  - Nginx optimization for static asset serving
  - Corepack for consistent package manager versions
  - Build-time API URL configuration

### Infrastructure Management:
- **Hetzner CPX11**: 2 vCPU, 4GB RAM, 40GB SSD (€4.50/month)
- **Docker Compose**: Service orchestration with health checks
- **Database**: PostgreSQL with persistent volumes and backup strategy
- **Caching**: Redis for session management and query optimization
- **Monitoring**: Health endpoints + container status monitoring

### Build & Deployment Commands:
```bash
# Local development
docker-compose -f docker-compose.dev.yml up -d

# Production build
docker build -t bir-notebook-server ./apps/server
docker build -t bir-notebook-web ./apps/web

# Release deployment (automated via GitHub Actions)
git tag v1.0.0
git push origin v1.0.0  # Triggers deployment
```

### Environment Variables:
```bash
# Production (.env)
APP_VERSION=1.0.0
NODE_ENV=production
DB_USER=bir_user
DB_PASSWORD=<secure-password>
DB_DATABASE=bir_notebook
LOG_LEVEL=info

# GitHub Secrets
HETZNER_HOST=<server-ip>
HETZNER_SSH_PRIVATE_KEY=<ssh-key>
APP_KEY=<adonis-secret>
VITE_API_URL=https://yourdomain.com
```

### Image Registry Usage:
```bash
# Pull latest images
docker pull ghcr.io/jjdechavez/bir-notebook-server:latest
docker pull ghcr.io/jjdechavez/bir-notebook-web:latest

# Pull specific version
docker pull ghcr.io/jjdechavez/bir-notebook-server:v1.0.0
docker pull ghcr.io/jjdechavez/bir-notebook-web:v1.0.0
```
