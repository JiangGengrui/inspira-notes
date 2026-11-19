export interface Note {
  id: string
  content: string
  tags: string[]
  pinned: boolean
  starred: boolean
  createdAt: number
  updatedAt: number
}

export type ViewMode = 'all' | 'pinned' | 'starred'

export type ThemeMode = 'light' | 'dark'

export interface NoteFilters {
  view: ViewMode
  tag: string | null
  query: string
}

export interface TagNode {
  path: string
  name: string
  count: number
  children: TagNode[]
}

export interface UndoEntry {
  note: Note
  index: number
}

export interface NoteGroup {
  key: string
  label: string
  notes: Note[]
}
