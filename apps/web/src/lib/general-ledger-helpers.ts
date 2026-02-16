import { format } from 'date-fns'

export function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-')
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
  return format(date, 'MMMM yyyy')
}

export function formatDate(date: string): string {
  return format(new Date(date), 'MMM dd, yyyy')
}

export function formatDateTime(dateTime: string): string {
  return format(new Date(dateTime), 'MMM dd, yyyy HH:mm')
}

export function getMonthsInRange(dateFrom: Date, dateTo: Date): string[] {
  const months: string[] = []
  let current = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), 1)
  const end = new Date(dateTo.getFullYear(), dateTo.getMonth(), 1)

  while (current <= end) {
    months.push(
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
    )
    current.setMonth(current.getMonth() + 1)
  }

  return months
}

export function generateMonthOptions(
  maxMonths: number = 12,
): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = []
  const current = new Date()

  for (let i = 0; i < maxMonths; i++) {
    const monthDate = new Date(current.getFullYear(), current.getMonth() - i, 1)
    const value = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
    const label = format(monthDate, 'MMMM yyyy')
    options.push({ value, label })
  }

  return options
}

export function checkTransferEligibility(transaction: any): boolean {
  return !!transaction.recordedAt && !transaction.transferredToGlAt
}

export function getTransferStatusBadge(transaction: any): {
  text: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
} {
  if (!transaction.recordedAt) {
    return { text: 'Draft', variant: 'outline' }
  }

  if (transaction.transferredToGlAt) {
    return { text: 'Transferred', variant: 'secondary' }
  }

  return { text: 'Recorded', variant: 'default' }
}
