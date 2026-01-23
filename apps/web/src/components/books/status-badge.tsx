import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  recorded: boolean
}

export function StatusBadge({ recorded }: StatusBadgeProps) {
  return (
    <Badge 
      variant={recorded ? "default" : "outline"}
      className={recorded ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
    >
      {recorded ? "Recorded" : "Draft"}
    </Badge>
  )
}