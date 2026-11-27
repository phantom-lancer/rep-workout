import { useEffect, type ReactNode } from 'react'

interface SheetProps {
  open: boolean
  title: string
  text?: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
  children?: ReactNode
}

export function Sheet({ open, title, text, confirmLabel, danger, onConfirm, onClose, children }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="sheet-veil" onClick={onClose} role="presentation">
      <div
        className="sheet glass"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        {text && <p>{text}</p>}
        {children}
        <div className="sheet-actions">
          <button className="btn btn-quiet" style={{ flex: 1, height: 50 }} onClick={onClose}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            style={danger ? { background: 'linear-gradient(180deg, rgba(232,154,148,.3), rgba(232,154,148,.12))', borderColor: 'rgba(232,154,148,.45)', color: '#f6dcd9' } : undefined}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

interface ToastData {
  id: number
  text: string
}

export function Toast({ toast }: { toast: ToastData | null }) {
  if (!toast) return null
  return (
    <div className="toast num" role="status" key={toast.id}>
      {toast.text}
    </div>
  )
}
