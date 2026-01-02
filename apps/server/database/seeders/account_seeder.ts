import Account from '#models/account'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class AccountSeeder extends BaseSeeder {
  async run() {
    // BIR-compliant Chart of Accounts for Small Business/Freelancer
    const accounts = [
      // ASSETS
      { code: '1101', name: 'Cash on Hand', type: 'asset' },
      { code: '1102', name: 'Cash in Bank', type: 'asset' },
      { code: '1103', name: 'Petty Cash Fund', type: 'asset' },
      { code: '1201', name: 'Accounts Receivable', type: 'asset' },
      { code: '1301', name: 'Office Supplies', type: 'asset' },
      { code: '1302', name: 'Office Equipment', type: 'asset' },
      { code: '1303', name: 'Computer Equipment', type: 'asset' },
      { code: '1304', name: 'Furniture & Fixtures', type: 'asset' },
      { code: '1401', name: 'Prepaid Rent', type: 'asset' },
      { code: '1402', name: 'Prepaid Insurance', type: 'asset' },
      
      // LIABILITIES
      { code: '2101', name: 'Accounts Payable', type: 'liability' },
      { code: '2102', name: 'Accrued Expenses', type: 'liability' },
      { code: '2103', name: 'Taxes Payable', type: 'liability' },
      { code: '2104', name: 'VAT Payable', type: 'liability' },
      { code: '2105', name: 'Withholding Tax Payable', type: 'liability' },
      { code: '2201', name: 'Notes Payable', type: 'liability' },
      { code: '2301', name: 'Loans Payable', type: 'liability' },
      
      // EQUITY
      { code: '3101', name: 'Owner\'s Capital', type: 'equity' },
      { code: '3102', name: 'Owner\'s Drawings', type: 'equity' },
      { code: '3201', name: 'Retained Earnings', type: 'equity' },
      { code: '3301', name: 'Income Summary', type: 'equity' },
      
      // REVENUE
      { code: '4101', name: 'Sales Revenue', type: 'revenue' },
      { code: '4102', name: 'Service Revenue', type: 'revenue' },
      { code: '4103', name: 'Consulting Fees', type: 'revenue' },
      { code: '4104', name: 'Professional Fees', type: 'revenue' },
      { code: '4105', name: 'Commission Income', type: 'revenue' },
      { code: '4106', name: 'Rental Income', type: 'revenue' },
      { code: '4107', name: 'Interest Income', type: 'revenue' },
      { code: '4108', name: 'Other Income', type: 'revenue' },
      
      // EXPENSES
      { code: '5101', name: 'Cost of Goods Sold', type: 'expense' },
      { code: '5201', name: 'Salaries & Wages', type: 'expense' },
      { code: '5202', name: 'Employee Benefits', type: 'expense' },
      { code: '5203', name: 'Contractor Fees', type: 'expense' },
      { code: '5301', name: 'Office Rent', type: 'expense' },
      { code: '5302', name: 'Utilities Expense', type: 'expense' },
      { code: '5303', name: 'Telephone & Internet', type: 'expense' },
      { code: '5304', name: 'Office Supplies Expense', type: 'expense' },
      { code: '5401', name: 'Marketing & Advertising', type: 'expense' },
      { code: '5402', name: 'Travel Expenses', type: 'expense' },
      { code: '5403', name: 'Meals & Entertainment', type: 'expense' },
      { code: '5404', name: 'Transportation Expense', type: 'expense' },
      { code: '5405', name: 'Fuel & Oil', type: 'expense' },
      { code: '5406', name: 'Repairs & Maintenance', type: 'expense' },
      { code: '5501', name: 'Insurance Expense', type: 'expense' },
      { code: '5502', name: 'Bank Service Charges', type: 'expense' },
      { code: '5503', name: 'Professional Fees', type: 'expense' },
      { code: '5504', name: 'Legal & Professional Services', type: 'expense' },
      { code: '5505', name: 'Training & Development', type: 'expense' },
      { code: '5506', name: 'Dues & Subscriptions', type: 'expense' },
      { code: '5601', name: 'Depreciation Expense', type: 'expense' },
      { code: '5602', name: 'Amortization Expense', type: 'expense' },
      { code: '5701', name: 'Bad Debts Expense', type: 'expense' },
      { code: '5702', name: 'Loss on Sale of Assets', type: 'expense' },
      { code: '5801', name: 'Income Tax Expense', type: 'expense' },
      { code: '5802', name: 'BIR Penalties', type: 'expense' },
      { code: '5803', name: 'Other Expenses', type: 'expense' },
    ]

    // Create accounts using fetchOrCreateMany to avoid duplicates
    await Account.fetchOrCreateMany('code', accounts)
  }
}