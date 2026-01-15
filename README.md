# BIR-Notebook

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
  'cash_receipt',     // Income transactions
  'cash_disbursement', // Expense transactions
  'general_journal',   // Adjustments/Corrections
  'ledger'            // Account summaries
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
- **Tag-based Releases**: Semantic versioning with `v*` tags
- **Multi-environment Support**: 
  - Production: Tagged releases (v1.0.0, v1.0.1, etc.)
  - Staging: `latest` tag (TODO - planned feature)
- **Zero-downtime Deployment**: Rolling updates via Docker Compose
- **Optimized Docker Builds**: Multi-stage builds with production-only dependencies
- **Container Security**: Non-root users, minimal attack surfaces
- **Health Monitoring**: Built-in health checks for all services

### Deployment Workflow:
1. **Push to `main` branch** → Build and push Docker images to GHCR
2. **Create tag** `v*` → Trigger release workflow
3. **Automatic deployment** to Hetzner with tagged images
4. **Version tracking** via `.env` variables and service labels

### Docker Optimization:
- **Multi-stage builds**: 4-stage optimization for size reduction
- **pnpm workspace support**: Efficient monorepo dependency management
- **Production-only dependencies**: ~70% image size reduction
- **Layer caching**: Faster rebuilds via GitHub Actions cache
- **Security best practices**: Non-root users, minimal base images

### Infrastructure Components:
- **PostgreSQL**: Persistent data storage with automated backups
- **Redis**: Session caching and performance optimization
- **Nginx**: Static asset serving with gzip compression
- **AdonisJS**: RESTful API with authentication and validation
- **React SPA**: Modern frontend with TanStack Router
