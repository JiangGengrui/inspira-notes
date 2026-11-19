import type { Note } from '../types'
import { makeId } from './id'
import { createSeedNotes } from './seed'
import { parseTags } from './tags'

export const NOTES_KEY = 'inspira.notes.v1'
export const THEME_KEY = 'inspira.theme'
const BACKUP_VERSION = 1

function toNote(value: unknown): Note | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.content !== 'string' || raw.content.trim() === '') return null

  const createdAt =
    typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now()

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : makeId(),
    content: raw.content,
    tags: parseTags(raw.content),
    pinned: Boolean(raw.pinned),
    starred: Boolean(raw.starred),
    createdAt,
    updatedAt:
      typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt) ? raw.updatedAt : createdAt
  }
}

function toNotes(list: unknown[]): Note[] {
  return list.map(toNote).filter((note): note is Note => note !== null)
}

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY)
    if (!raw) return createSeedNotes()
    const parsed = JSON.parse(raw) as { notes?: unknown } | unknown[]
    const list = Array.isArray(parsed) ? parsed : parsed.notes
    if (!Array.isArray(list)) return []
    return toNotes(list)
  } catch {
    return []
  }
}

export function saveNotes(notes: Note[]): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify({ version: BACKUP_VERSION, notes }))
  } catch {
    // 本地存储不可用时静默失败，不阻塞编辑
  }
}

export function createBackup(notes: Note[]): string {
  return JSON.stringify(
    {
      app: 'inspira',
      name: '灵感便签',
      version: BACKUP_VERSION,
      exportedAt: Date.now(),
      notes
    },
    null,
    2
  )
}

export function parseBackup(text: string): Note[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('无法解析该文件，请选择灵感便签导出的 JSON 备份')
  }

  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { notes?: unknown }).notes)
      ? (parsed as { notes: unknown[] }).notes
      : null

  if (!list) throw new Error('备份格式不正确：缺少 notes 列表')

  const notes = toNotes(list)
  if (list.length > 0 && notes.length === 0) {
    throw new Error('备份中没有任何有效的便签')
  }
  return notes
}
