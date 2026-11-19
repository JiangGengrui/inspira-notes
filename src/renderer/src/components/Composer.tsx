import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { Check, CornerDownLeft, Feather, Hash } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Note } from '../types'
import { parseTags, tagHue } from '../lib/tags'
import { useNotes } from '../store/notes'

interface ComposerProps {
  inputRef: RefObject<HTMLTextAreaElement>
  onSaved?: (note: Note) => void
}

export function Composer({ inputRef, onSaved }: ComposerProps): JSX.Element {
  const { addNote } = useNotes()
  const [value, setValue] = useState('')
  const [justSaved, setJustSaved] = useState(false)
  const savedTimer = useRef<number | undefined>(undefined)
  const tags = useMemo(() => parseTags(value), [value])

  useLayoutEffect(() => {
    const element = inputRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 220)}px`
  }, [value, inputRef])

  useEffect(() => () => window.clearTimeout(savedTimer.current), [])

  const submit = (): void => {
    const note = addNote(value)
    if (!note) return
    setValue('')
    setJustSaved(true)
    window.clearTimeout(savedTimer.current)
    savedTimer.current = window.setTimeout(() => setJustSaved(false), 1_600)
    inputRef.current?.focus()
    onSaved?.(note)
  }

  return (
    <section className="composer" aria-label="快速记录灵感">
      <textarea
        id="capture-input"
        ref={inputRef}
        value={value}
        rows={2}
        placeholder="此刻，有什么想法闪过？随手记下来…"
        aria-label="新灵感内容"
        onChange={(event) => {
          setValue(event.target.value)
          if (justSaved) setJustSaved(false)
        }}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault()
            submit()
          }
        }}
      />

      {tags.length > 0 && (
        <div className="composer-tags">
          {tags.map((tag) => (
            <span
              key={tag}
              className="tag-chip is-static"
              style={{ '--tag-hue': tagHue(tag) } as CSSProperties}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="composer-foot">
        <div className="composer-hints">
          <span className="hint">
            <Hash size={12} />
            父标签/子标签自动归类
          </span>
          <span className="hint">
            <CornerDownLeft size={12} />
            Ctrl + Enter 收下灵感
          </span>
        </div>
        <motion.button
          type="button"
          className={`save-btn ${justSaved ? 'is-saved' : ''}`}
          disabled={!value.trim()}
          onClick={submit}
          whileTap={{ scale: 0.96 }}
        >
          {justSaved ? <Check size={15} /> : <Feather size={15} />}
          {justSaved ? '已收下' : '收下灵感'}
        </motion.button>
      </div>
    </section>
  )
}
