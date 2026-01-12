import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import { formatAmountToCurrency } from '@bir-notebook/shared/helpers/currency'

interface BookExportProps {
  bookType: string
  title: string
  transactions: any[]
  dateFrom: string
  dateTo: string
}

export function BookExport({
  title,
  transactions,
  dateFrom,
  dateTo,
}: BookExportProps) {
  const handleExportPDF = () => {
    // Generate PDF for BIR submission
    const printContent = generatePrintContent()
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleExportExcel = () => {
    // Generate Excel for backup
    const csvContent = generateCSVContent()
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_')}_${dateFrom}_to_${dateTo}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const generatePrintContent = () => {
    const totalDebits = transactions.reduce((sum, t) => sum + t.amount, 0)
    const totalCredits = transactions.reduce((sum, t) => sum + t.amount, 0)

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .totals { border-top: 2px solid #000; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Period: ${dateFrom} to ${dateTo}</p>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="info">
          <p><strong>Total Transactions:</strong> ${transactions.length}</p>
          <p><strong>Total Debits:</strong> ${formatAmountToCurrency(totalDebits)}</p>
          <p><strong>Total Credits:</strong> ${formatAmountToCurrency(totalCredits)}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Reference</th>
              <th>Debit Account</th>
              <th>Credit Account</th>
              <th class="text-right">Amount</th>
              <th>VAT Type</th>
            </tr>
          </thead>
          <tbody>
            ${transactions
              .map(
                (transaction) => `
              <tr>
                <td>${new Date(transaction.transactionDate).toLocaleDateString()}</td>
                <td>${transaction.description}</td>
                <td>${transaction.referenceNumber || '-'}</td>
                <td>${transaction.debitAccount?.code} - ${transaction.debitAccount?.name}</td>
                <td>${transaction.creditAccount?.code} - ${transaction.creditAccount?.name}</td>
                <td class="text-right">${formatAmountToCurrency(transaction.amount)}</td>
                <td>${transaction.vatType === 'vat_standard' ? '12%' : 'Exempt'}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
          <tfoot>
            <tr class="totals font-bold">
              <td colspan="5" class="text-right">Totals:</td>
              <td class="text-right">${formatAmountToCurrency(totalDebits)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <div class="footer no-print" style="margin-top: 50px;">
          <p><strong>BIR Compliance Note:</strong> This book is prepared according to BIR requirements for proper record keeping.</p>
        </div>
      </body>
      </html>
    `
  }

  const generateCSVContent = () => {
    const headers = [
      'Date',
      'Description',
      'Reference',
      'Debit Account Code',
      'Debit Account Name',
      'Credit Account Code',
      'Credit Account Name',
      'Amount',
      'VAT Type',
    ]
    const rows = transactions.map((transaction) => [
      new Date(transaction.transactionDate).toLocaleDateString(),
      transaction.description,
      transaction.referenceNumber || '',
      transaction.debitAccount?.code || '',
      transaction.debitAccount?.name || '',
      transaction.creditAccount?.code || '',
      transaction.creditAccount?.name || '',
      transaction.amount.toString(),
      transaction.vatType === 'vat_standard' ? '12%' : 'Exempt',
    ])

    return [headers, ...rows].map((row) => row.join(',')).join('\n')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={handleExportPDF} className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            Export as PDF (BIR Format)
          </Button>
          <Button
            onClick={handleExportExcel}
            variant="outline"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Export as Excel (Backup)
          </Button>
        </div>

        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>PDF Export:</strong> Formatted for BIR submission with
            proper layout
          </p>
          <p>
            <strong>Excel Export:</strong> CSV format for data backup and
            analysis
          </p>
          <p>
            <strong>Period:</strong> {dateFrom} to {dateTo}
          </p>
          <p>
            <strong>Transactions:</strong> {transactions.length} records
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
