import TransactionCategory from '#models/transaction_category'
import Account from '#models/account'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class TransactionCategorySeeder extends BaseSeeder {
  async run() {
    // Get accounts for default assignments
    const accounts = await Account.all()
    const accountMap = new Map(accounts.map(a => [a.code, a.id]))
    
    const categories = [
      // CASH RECEIPTS JOURNAL CATEGORIES
      {
        name: 'Sales Income - Cash',
        bookType: 'cash_receipt',
        defaultDebitAccountId: accountMap.get('1101'), // Cash on Hand
        defaultCreditAccountId: accountMap.get('4101'), // Sales Revenue
      },
      {
        name: 'Service Income - Cash',
        bookType: 'cash_receipt',
        defaultDebitAccountId: accountMap.get('1101'), // Cash on Hand
        defaultCreditAccountId: accountMap.get('4102'), // Service Revenue
      },
      {
        name: 'Consulting Fees - Cash',
        bookType: 'cash_receipt',
        defaultDebitAccountId: accountMap.get('1101'), // Cash on Hand
        defaultCreditAccountId: accountMap.get('4103'), // Consulting Fees
      },
      {
        name: 'Professional Fees - Cash',
        bookType: 'cash_receipt',
        defaultDebitAccountId: accountMap.get('1101'), // Cash on Hand
        defaultCreditAccountId: accountMap.get('4104'), // Professional Fees
      },
      {
        name: 'Commission Income - Cash',
        bookType: 'cash_receipt',
        defaultDebitAccountId: accountMap.get('1101'), // Cash on Hand
        defaultCreditAccountId: accountMap.get('4105'), // Commission Income
      },
      {
        name: 'Rental Income - Cash',
        bookType: 'cash_receipt',
        defaultDebitAccountId: accountMap.get('1101'), // Cash on Hand
        defaultCreditAccountId: accountMap.get('4106'), // Rental Income
      },
      {
        name: 'Interest Income - Cash',
        bookType: 'cash_receipt',
        defaultDebitAccountId: accountMap.get('1101'), // Cash on Hand
        defaultCreditAccountId: accountMap.get('4107'), // Interest Income
      },
      {
        name: 'Collection from Receivables',
        bookType: 'cash_receipt',
        defaultDebitAccountId: accountMap.get('1101'), // Cash on Hand
        defaultCreditAccountId: accountMap.get('1201'), // Accounts Receivable
      },
      {
        name: 'Cash Refunds to Customers',
        bookType: 'cash_receipt',
        defaultDebitAccountId: accountMap.get('4101'), // Sales Revenue
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Owner\'s Capital Contribution',
        bookType: 'cash_receipt',
        defaultDebitAccountId: accountMap.get('1101'), // Cash on Hand
        defaultCreditAccountId: accountMap.get('3101'), // Owner's Capital
      },
      {
        name: 'Loan Proceeds Received',
        bookType: 'cash_receipt',
        defaultDebitAccountId: accountMap.get('1101'), // Cash on Hand
        defaultCreditAccountId: accountMap.get('2201'), // Notes Payable
      },
      
      // CASH DISBURSEMENTS JOURNAL CATEGORIES
      {
        name: 'Office Rent Payment',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('5301'), // Office Rent
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Salaries & Wages Payment',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('5201'), // Salaries & Wages
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Utilities Payment',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('5302'), // Utilities Expense
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Telephone & Internet Payment',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('5303'), // Telephone & Internet
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Office Supplies Purchase',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('5304'), // Office Supplies Expense
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Marketing & Advertising',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('5401'), // Marketing & Advertising
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Travel Expenses',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('5402'), // Travel Expenses
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Meals & Entertainment',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('5403'), // Meals & Entertainment
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Transportation Expenses',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('5404'), // Transportation Expense
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Fuel & Oil Purchase',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('5405'), // Fuel & Oil
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Insurance Payment',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('5501'), // Insurance Expense
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Professional Fees Payment',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('5503'), // Professional Fees
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Training & Development',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('5505'), // Training & Development
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Dues & Subscriptions',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('5506'), // Dues & Subscriptions
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Payment to Suppliers',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('2101'), // Accounts Payable
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Owner\'s Drawings',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('3102'), // Owner's Drawings
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Loan Payment',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('2201'), // Notes Payable
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Tax Payments',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('2103'), // Taxes Payable
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'VAT Payment',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('2104'), // VAT Payable
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Bank Deposits',
        bookType: 'cash_disbursement',
        defaultDebitAccountId: accountMap.get('1102'), // Cash in Bank
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      
      // GENERAL JOURNAL CATEGORIES
      {
        name: 'Depreciation Expense',
        bookType: 'general_journal',
        defaultDebitAccountId: accountMap.get('5601'), // Depreciation Expense
        defaultCreditAccountId: accountMap.get('1302'), // Office Equipment (Accumulated Depreciation)
      },
      {
        name: 'Amortization Expense',
        bookType: 'general_journal',
        defaultDebitAccountId: accountMap.get('5602'), // Amortization Expense
        defaultCreditAccountId: accountMap.get('1401'), // Prepaid Rent
      },
      {
        name: 'Accrued Expenses',
        bookType: 'general_journal',
        defaultDebitAccountId: accountMap.get('5201'), // Salaries & Wages
        defaultCreditAccountId: accountMap.get('2102'), // Accrued Expenses
      },
      {
        name: 'Prepaid Expenses',
        bookType: 'general_journal',
        defaultDebitAccountId: accountMap.get('1401'), // Prepaid Rent
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
      {
        name: 'Bad Debts Expense',
        bookType: 'general_journal',
        defaultDebitAccountId: accountMap.get('5701'), // Bad Debts Expense
        defaultCreditAccountId: accountMap.get('1201'), // Accounts Receivable
      },
      {
        name: 'Year-End Closing',
        bookType: 'general_journal',
        defaultDebitAccountId: accountMap.get('4101'), // Sales Revenue
        defaultCreditAccountId: accountMap.get('3301'), // Income Summary
      },
      {
        name: 'Inventory Adjustments',
        bookType: 'general_journal',
        defaultDebitAccountId: accountMap.get('5101'), // Cost of Goods Sold
        defaultCreditAccountId: accountMap.get('1301'), // Office Supplies
      },
      {
        name: 'Correction of Errors',
        bookType: 'general_journal',
        defaultDebitAccountId: accountMap.get('5803'), // Other Expenses
        defaultCreditAccountId: accountMap.get('1101'), // Cash on Hand
      },
    ]

    // Create categories using fetchOrCreateMany to avoid duplicates
    await TransactionCategory.fetchOrCreateMany('name', categories)
  }
}