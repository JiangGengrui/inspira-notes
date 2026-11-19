import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw, Sparkles, X } from 'lucide-react'
import type { Note } from '../types'
import { DAY, formatFullDate } from '../lib/date'
import { stripTags, tagHue } from '../lib/tags'

interface ReviewDialogProps {
  notes: Note[]
  onClose: () => void
}

function pickNote(notes: Note[], excludeId?: string): Note | null {
  const pool = notes.filter((note) => note.id !== excludeId)
  const older = pool.filter((note) => Date.now() - note.createdAt > DAY)
  const candidates = older.length > 0 ? older : pool
  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export function ReviewDialog({ notes, onClose }: ReviewDialogProps): JSX.Element {
  const [current, setCurrent] = useState<Note | null>(() => pickNote(notes))

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const shuffle = useCallback(() => {
    const next = pickNote(notes, current?.id)
    if (next) setCurrent(next)
  }, [notes, current?.id])

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onMouseDown={onClose}
    >
      <motion.div
        className="modal review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        initial={{ opacity: 0, y: 26, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-head">
          <div>
            <p className="modal-kicker">
              <Sparkles size={12} />
              灵感回顾
            </p>
            <h2 id="review-title">与旧灵感重逢</h2>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="关闭">
            <X size={16} />
          </button>
        </header>

        <div className="review-stage">
          <AnimatePresence mode="wait" initial={false}>
            {current && (
              <motion.blockquote
                key={current.id}
                className="review-quote"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24 }}
              >
                <p>{stripTags(current.content)}</p>
                <footer>
                  <span className="review-date">写于 {formatFullDate(current.createdAt)}</span>
                  {current.tags.length > 0 && (
                    <span className="review-tags">
                      {current.tags.map((tag) => (
                        <span
                          key={tag}
                          className="tag-chip is-static"
                          style={{ '--tag-hue': tagHue(tag) } as CSSProperties}
                        >
                          #{tag}
                        </span>
                      ))}
                    </span>
                  )}
                </footer>
              </motion.blockquote>
            )}
          </AnimatePresence>
        </div>

        <footer className="modal-foot">
          <span className="hint">旧念头常常会在新语境里重新发光</span>
          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={shuffle}>
              <RefreshCw size={13} />
              换一条
            </button>
            <button type="button" className="primary-btn" onClick={onClose}>
              收好，继续写
            </button>
          </div>
        </footer>
      </motion.div>
    </motion.div>
  )
}
