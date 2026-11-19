import type { Note, NoteFilters } from '../types'
import { noteMatchesTag } from './tags'

export function filterNotes(notes: Note[], filters: NoteFilters): Note[] {
  const query = filters.query.trim().toLowerCase()

  return notes
    .filter((note) => {
      if (filters.view === 'pinned' && !note.pinned) return false
      if (filters.view === 'starred' && !note.starred) return false
      if (filters.tag && !noteMatchesTag(note, filters.tag)) return false
      if (query) {
        const haystack = `${note.content}\n${note.tags.join(' ')}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt)
}
