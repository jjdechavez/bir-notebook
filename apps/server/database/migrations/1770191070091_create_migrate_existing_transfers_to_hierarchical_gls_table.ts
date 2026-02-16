import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    // This migration converts existing tagged transfers to hierarchical GL structure
    // First, create parent GL records for each transfer group
    
    // Create parent GL records from existing transfer groups
    await this.db.raw(`
      INSERT INTO transactions (
        user_id,
        book_type,
        description,
        amount,
        debit_account_id,
        credit_account_id,
        gl_posting_month,
        recorded_at,
        created_at,
        updated_at,
        category_id,
        reference_number,
        vat_type,
        gl_id,
        transferred_to_gl_at,
        transaction_date
      )
      SELECT 
        t.user_id,
        'general_ledger' as book_type,
        CONCAT('Migrated GL transfer - ', t.gl_posting_month) as description,
        SUM(t.amount) as amount,
        t.debit_account_id,
        t.credit_account_id,
        t.gl_posting_month,
        t.transferred_to_gl_at as recorded_at,
        t.transferred_to_gl_at as created_at,
        t.transferred_to_gl_at as updated_at,
        NULL as category_id,
        NULL as reference_number,
        NULL as vat_type,
        NULL as gl_id,
        NULL as transferred_to_gl_at,
        t.transferred_to_gl_at as transaction_date
      FROM transactions t
      WHERE t.transfer_group_id IS NOT NULL
        AND t.transferred_to_gl_at IS NOT NULL
      GROUP BY t.transfer_group_id, t.user_id, t.debit_account_id, t.credit_account_id, t.gl_posting_month, t.transferred_to_gl_at
    `)
    
    // Update existing transactions to link to their new parent GL records
    await this.db.raw(`
      UPDATE transactions t
      SET gl_id = (
        SELECT p.id 
        FROM transactions p
        WHERE p.book_type = 'general_ledger'
          AND p.user_id = t.user_id
          AND p.debit_account_id = t.debit_account_id
          AND p.credit_account_id = t.credit_account_id
          AND p.gl_posting_month = t.gl_posting_month
          AND p.created_at = t.transferred_to_gl_at
        LIMIT 1
      )
      WHERE t.transfer_group_id IS NOT NULL
        AND t.transferred_to_gl_at IS NOT NULL
    `)
  }

  async down() {
    // Revert: Remove created parent GL records and clear gl_id references
    
    // Clear gl_id from child transactions
    await this.db.raw(`
      UPDATE transactions 
      SET gl_id = NULL 
      WHERE gl_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM transactions p 
          WHERE p.id = transactions.gl_id 
            AND p.book_type = 'general_ledger'
            AND p.description LIKE 'Migrated GL transfer - %'
        )
    `)
    
    // Remove migrated parent GL records
    await this.db.raw(`
      DELETE FROM transactions 
      WHERE book_type = 'general_ledger'
        AND description LIKE 'Migrated GL transfer - %'
    `)
  }
}