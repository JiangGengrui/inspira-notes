import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface ToastProps {
  message: string
  icon?: ReactNode
  actionLabel?: string
  onAction?: () => void
}

export function Toast({ message, icon, actionLabel, onAction }: ToastProps): JSX.Element {
  return (
    <div className="toast-layer" role="status" aria-live="polite">
      <motion.div
        className="toast"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      >
        {icon && <span className="toast-icon">{icon}</span>}
        <span className="toast-msg">{message}</span>
        {actionLabel && onAction && (
          <button type="button" className="toast-action" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </motion.div>
    </div>
  )
}
