import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  children?: ReactNode
  className?: string
}

export function Header({ title, children, className }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/95 backdrop-blur-md px-4',
        className,
      )}
    >
      <h1 className="text-lg font-bold text-card-foreground truncate">{title}</h1>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </header>
  )
}
