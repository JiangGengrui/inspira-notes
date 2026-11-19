import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Pin, Star, Trash2 } from 'lucide-react'
import type { Note } from '../types'
import { formatFullDate, formatRelative } from '../lib/date'
import { stripTags, tagHue } from '../lib/tags'
import { useNotes } from '../store/notes'

interface NoteCardProps {
  note: Note
  index: number
  query: string
  onEdit: (note: Note) => void
  onDelete: (note: Note) => void
  onTagClick: (tag: string) => void
}

function renderBody(content: string, query: string): ReactNode {
  const text = stripTags(content)
  const keyword = query.trim()
  if (!keyword) return text

  const haystack = text.toLowerCase()
  const needle = keyword.toLowerCase()
  const parts: ReactNode[] = []
  let cursor = 0
  let index = haystack.indexOf(needle)

  while (index !== -1 && parts.length < 60) {
    if (index > cursor) parts.push(text.slice(cursor, index))
    parts.push(
      <mark className="search-mark" key={`${index}-${parts.length}`}>
        {text.slice(index, index + keyword.length)}
      </mark>
    )
    cursor = index + keyword.length
    index = haystack.indexOf(needle, cursor)
  }
  parts.push(text.slice(cursor))
  return parts
}

export function NoteCard({
  note,
  index,
  query,
  onEdit,
  onDelete,
  onTagClick
}: NoteCardProps): JSX.Element {
  const { togglePin, toggleStar } = useNotes()

  return (
    <motion.article
      className={`note-card ${note.pinned ? 'is-pinned' : ''}`}
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.16 } }}
      transition={{
        duration: 0.36,
        delay: Math.min(index * 0.035, 0.24),
        ease: [0.22, 1, 0.36, 1]
      }}
      onDoubleClick={() => onEdit(note)}
    >
      <header className="card-head">
        <time
          className="card-time"
          dateTime={new Date(note.createdAt).toISOString()}
          title={formatFullDate(note.createdAt)}
        >
          {formatRelative(note.createdAt)}
        </time>
        <div className="card-badges">
          {note.pinned && <Pin size={12} className="badge" aria-label="已置顶" />}
          {note.starred && (
            <Star size={12} className="badge is-starred" fill="currentColor" aria-label="已星标" />
          )}
        </div>
        <div className="card-actions" onDoubleClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            className={`card-icon ${note.pinned ? 'is-on' : ''}`}
            title={note.pinned ? '取消置顶' : '置顶'}
            aria-pressed={note.pinned}
            onClick={() => togglePin(note.id)}
          >
            <Pin size={13} />
          </button>
          <button
            type="button"
            className={`card-icon ${note.starred ? 'is-on' : ''}`}
            title={note.starred ? '取消星标' : '星标'}
            aria-pressed={note.starred}
            onClick={() => toggleStar(note.id)}
          >
            <Star size={13} fill={note.starred ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            className="card-icon"
            title="编辑"
            onClick={() => onEdit(note)}
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            className="card-icon is-danger"
            title="删除"
            onClick={() => onDelete(note)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </header>

      <p className="card-body">{renderBody(note.content, query)}</p>

      {note.tags.length > 0 && (
        <footer className="card-tags">
          {note.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="tag-chip"
              style={{ '--tag-hue': tagHue(tag) } as CSSProperties}
              onClick={() => onTagClick(tag)}
              title={`筛选 #${tag}`}
            >
              #{tag}
            </button>
          ))}
        </footer>
      )}
    </motion.article>
  )
}
