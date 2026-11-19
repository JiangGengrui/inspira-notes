import type { Note, NoteGroup } from '../types'

export const DAY = 86_400_000

export function startOfDay(ts: number): number {
  const date = new Date(ts)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export function dateKey(ts: number): string {
  const date = new Date(ts)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function formatTime(ts: number): string {
  const date = new Date(ts)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function formatRelative(ts: number, now = Date.now()): string {
  const diff = now - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`

  const today = startOfDay(now)
  const day = startOfDay(ts)
  if (day === today) return `今天 ${formatTime(ts)}`
  if (day === today - DAY) return `昨天 ${formatTime(ts)}`
  if (day > today - 7 * DAY) return `周${WEEKDAYS[new Date(ts).getDay()]} ${formatTime(ts)}`

  const date = new Date(ts)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const dayOfMonth = date.getDate()
  if (year === new Date(now).getFullYear()) return `${month} 月 ${dayOfMonth} 日`
  return `${year} 年 ${month} 月 ${dayOfMonth} 日`
}

export function formatFullDate(ts: number): string {
  const date = new Date(ts)
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日 · ${formatTime(ts)}`
}

export function groupNotesByDay(notes: Note[], now = Date.now()): NoteGroup[] {
  const today = startOfDay(now)
  const yesterday = today - DAY
  const weekdayIndex = (new Date(today).getDay() + 6) % 7
  const weekStart = today - weekdayIndex * DAY
  const groups = new Map<string, NoteGroup>()

  const push = (key: string, label: string, note: Note): void => {
    const group = groups.get(key)
    if (group) {
      group.notes.push(note)
    } else {
      groups.set(key, { key, label, notes: [note] })
    }
  }

  for (const note of notes) {
    const ts = note.createdAt
    if (ts >= today) {
      push('today', '今天', note)
    } else if (ts >= yesterday) {
      push('yesterday', '昨天', note)
    } else if (ts >= weekStart) {
      push('week', '本周', note)
    } else {
      const date = new Date(ts)
      const key = `month-${date.getFullYear()}-${date.getMonth() + 1}`
      const label =
        date.getFullYear() === new Date(now).getFullYear()
          ? `${date.getMonth() + 1} 月`
          : `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`
      push(key, label, note)
    }
  }

  const ordered: NoteGroup[] = []
  for (const key of ['today', 'yesterday', 'week']) {
    const group = groups.get(key)
    if (group) ordered.push(group)
  }

  const months = Array.from(groups.values())
    .filter((group) => group.key.startsWith('month-'))
    .sort((a, b) => b.notes[0].createdAt - a.notes[0].createdAt)
  ordered.push(...months)

  for (const group of ordered) {
    group.notes.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt)
  }

  return ordered
}

export interface HeatCell {
  key: string
  count: number
  level: number
  title: string
}

export interface HeatWeek {
  key: string
  cells: HeatCell[]
}

export interface HeatmapData {
  weeks: HeatWeek[]
  total: number
  activeDays: number
  streak: number
}

function heatLevel(count: number): number {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

export function calcStreak(notes: Note[], now = Date.now()): number {
  const days = new Set(notes.map((note) => dateKey(note.createdAt)))
  let cursor = startOfDay(now)
  if (!days.has(dateKey(cursor))) {
    cursor -= DAY
    if (!days.has(dateKey(cursor))) return 0
  }
  let streak = 0
  while (days.has(dateKey(cursor))) {
    streak += 1
    cursor -= DAY
  }
  return streak
}

export function buildHeatmap(notes: Note[], weeksCount = 16, now = Date.now()): HeatmapData {
  const today = startOfDay(now)
  const endWeekStart = today - ((new Date(today).getDay() + 6) % 7) * DAY
  const start = endWeekStart - (weeksCount - 1) * 7 * DAY

  const counts = new Map<string, number>()
  for (const note of notes) {
    const key = dateKey(note.createdAt)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const weeks: HeatWeek[] = []
  for (let weekIndex = 0; weekIndex < weeksCount; weekIndex += 1) {
    const weekStart = start + weekIndex * 7 * DAY
    const cells: HeatCell[] = []
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const ts = weekStart + dayIndex * DAY
      if (ts > today) {
        cells.push({ key: `${ts}-future`, count: -1, level: -1, title: '' })
        continue
      }
      const key = dateKey(ts)
      const count = counts.get(key) ?? 0
      const date = new Date(ts)
      cells.push({
        key,
        count,
        level: heatLevel(count),
        title: `${date.getMonth() + 1} 月 ${date.getDate()} 日 · ${
          count > 0 ? `${count} 条灵感` : '没有记录'
        }`
      })
    }
    weeks.push({ key: dateKey(weekStart), cells })
  }

  const total = notes.length
  const activeDays = counts.size
  return { weeks, total, activeDays, streak: calcStreak(notes, now) }
}
