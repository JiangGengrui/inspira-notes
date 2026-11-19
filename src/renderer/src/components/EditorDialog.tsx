import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { Note } from '../types'
import { formatFullDate } from '../lib/date'
import { parseTags, tagHue } from '../lib/tags'
import { useNotes } from '../store/notes'

interface EditorDialogProps {
  note: Note
  onClose: () => void
}

export function EditorDialog({ note, onClose }: EditorDialogProps): JSX.Element {
  const { updateNote } = useNotes()
  const [draft, setDraft] = useState(note.content)
  const tags = useMemo(() => parseTags(draft), [draft])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const save = (): void => {
    if (!draft.trim()) return
    updateNote(note.id, draft)
    onClose()
  }

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
        className="modal editor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
        initial={{ opacity: 0, y: 26, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-head">
          <div>
            <p className="modal-kicker">编辑灵感</p>
            <h2 id="editor-title">{formatFullDate(note.createdAt)}</h2>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="关闭">
            <X size={16} />
          </button>
        </header>

        <textarea
          className="editor-text"
          value={draft}
          autoFocus
          spellCheck={false}
          aria-label="编辑灵感内容"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
              event.preventDefault()
              save()
            }
          }}
        />

        <div className="editor-tags">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <span
                key={tag}
                className="tag-chip is-static"
                style={{ '--tag-hue': tagHue(tag) } as CSSProperties}
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="hint">写 #标签 可以让这条灵感更容易被找回来</span>
          )}
        </div>

        <footer className="modal-foot">
          <span className="hint">Ctrl + Enter 保存 · Esc 取消</span>
          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={onClose}>
              取消
            </button>
            <button type="button" className="primary-btn" disabled={!draft.trim()} onClick={save}>
              保存修改
            </button>
          </div>
        </footer>
      </motion.div>
    </motion.div>
  )
}
