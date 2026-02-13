'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

let addToastFn: ((message: string, variant?: ToastVariant) => void) | null = null

/** Global toast trigger — call from anywhere */
export function toast(message: string, variant: ToastVariant = 'info') {
  addToastFn?.(message, variant)
}

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-primary shrink-0" />,
  error: <AlertCircle className="h-4 w-4 text-destructive shrink-0" />,
  info: <Info className="h-4 w-4 text-secondary shrink-0" />,
}

const BG_CLASSES: Record<ToastVariant, string> = {
  success: 'bg-primary/10 border-primary/20',
  error: 'bg-destructive/10 border-destructive/20',
  info: 'bg-secondary/10 border-secondary/20',
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    addToastFn = (message: string, variant: ToastVariant = 'info') => {
      const id = `${Date.now()}-${Math.random()}`
      setToasts((prev) => [...prev, { id, message, variant }])

      // Auto-remove after 4s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    }

    return () => {
      addToastFn = null
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-slide-down ${BG_CLASSES[t.variant]}`}
        >
          {ICONS[t.variant]}
          <span className="text-sm font-medium flex-1">{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
