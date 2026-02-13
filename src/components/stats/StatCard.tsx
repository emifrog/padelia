import { Card } from '@/components/ui'
import type { ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  subValue?: string
  variant?: 'default' | 'primary' | 'secondary'
}

const VARIANT_STYLES = {
  default: 'text-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary',
} as const

export function StatCard({ icon, label, value, subValue, variant = 'default' }: StatCardProps) {
  return (
    <Card className="flex flex-col items-center text-center gap-1 py-3">
      <div className="text-muted-foreground mb-1">{icon}</div>
      <p className={`text-2xl font-bold ${VARIANT_STYLES[variant]}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {subValue && <p className="text-[10px] text-muted-foreground">{subValue}</p>}
    </Card>
  )
}
