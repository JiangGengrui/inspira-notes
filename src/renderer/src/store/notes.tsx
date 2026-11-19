import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import type { Note, UndoEntry } from '../types'
import { makeId } from '../lib/id'
import { parseTags } from '../lib/tags'
import { loadNotes, saveNotes } from '../lib/storage'

interface NotesContextValue {
  notes: Note[]
  undo: UndoEntry | null
  addNote: (content: string) => Note | null
  updateNote: (id: string, content: string) => void
  removeNote: (id: string) => void
  togglePin: (id: string) => void
  toggleStar: (id: string) => void
  restoreUndo: () => void
  dismissUndo: () => void
  replaceNotes: (notes: Note[]) => void
}

const NotesContext = createContext<NotesContextValue | null>(null)

export function NotesProvider({ children }: { children: ReactNode }): JSX.Element {
  const [notes, setNotes] = useState<Note[]>(loadNotes)
  const [undo, setUndo] = useState<UndoEntry | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => saveNotes(notes), 200)
    return () => window.clearTimeout(timer)
  }, [notes])

  const addNote = useCallback((content: string): Note | null => {
    const trimmed = content.trim()
    if (!trimmed) return null
    const now = Date.now()
    const note: Note = {
      id: makeId(),
      content: trimmed,
      tags: parseTags(trimmed),
      pinned: false,
      starred: false,
      createdAt: now,
      updatedAt: now
    }
    setNotes((prev) => [note, ...prev])
    return note
  }, [])

  const updateNote = useCallback((id: string, content: string): void => {
    const trimmed = content.trim()
    if (!trimmed) return
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? { ...note, content: trimmed, tags: parseTags(trimmed), updatedAt: Date.now() }
          : note
      )
    )
  }, [])

  const removeNote = useCallback(
    (id: string): void => {
      const index = notes.findIndex((note) => note.id === id)
      if (index === -1) return
      setNotes((prev) => prev.filter((note) => note.id !== id))
      setUndo({ note: notes[index], index })
    },
    [notes]
  )

  const togglePin = useCallback((id: string): void => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note))
    )
  }, [])

  const toggleStar = useCallback((id: string): void => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, starred: !note.starred } : note))
    )
  }, [])

  const restoreUndo = useCallback((): void => {
    if (!undo) return
    setNotes((prev) => {
      const next = [...prev]
      next.splice(Math.min(undo.index, next.length), 0, undo.note)
      return next
    })
    setUndo(null)
  }, [undo])

  const dismissUndo = useCallback((): void => {
    setUndo(null)
  }, [])

  const replaceNotes = useCallback((incoming: Note[]): void => {
    setNotes(incoming)
    setUndo(null)
  }, [])

  const value = useMemo<NotesContextValue>(
    () => ({
      notes,
      undo,
      addNote,
      updateNote,
      removeNote,
      togglePin,
      toggleStar,
      restoreUndo,
      dismissUndo,
      replaceNotes
    }),
    [
      notes,
      undo,
      addNote,
      updateNote,
      removeNote,
      togglePin,
      toggleStar,
      restoreUndo,
      dismissUndo,
      replaceNotes
    ]
  )

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}

export function useNotes(): NotesContextValue {
  const context = useContext(NotesContext)
  if (!context) throw new Error('useNotes 必须在 NotesProvider 内使用')
  return context
}
