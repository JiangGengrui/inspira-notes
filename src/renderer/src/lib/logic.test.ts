import { describe, expect, it } from 'vitest'
import type { Note } from '../types'
import { buildHeatmap, calcStreak, groupNotesByDay } from './date'
import { filterNotes } from './filters'
import { createBackup, parseBackup } from './storage'
import { buildTagTree, parseTags, stripTags } from './tags'

const NOW = new Date(2026, 10, 20, 12, 0, 0).getTime()
const DAY = 86_400_000

function makeNote(overrides: Partial<Note> & Pick<Note, 'content'>): Note {
  const createdAt = overrides.createdAt ?? NOW
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    content: overrides.content,
    tags: overrides.tags ?? parseTags(overrides.content),
    pinned: overrides.pinned ?? false,
    starred: overrides.starred ?? false,
    createdAt,
    updatedAt: overrides.updatedAt ?? createdAt
  }
}

describe('标签解析', () => {
  it('解析普通与多级标签并去重', () => {
    expect(parseTags('记录想法 #产品/灵感 #设计 #产品/灵感')).toEqual(['产品/灵感', '设计'])
  })

  it('移除正文中的标签并保留语义空格', () => {
    expect(stripTags('给卡片加一个 #设计/排版 的动效')).toBe('给卡片加一个 的动效')
  })

  it('构建带层级计数的标签树', () => {
    const notes = [
      makeNote({ content: 'a #设计/排版 #设计/配色' }),
      makeNote({ content: 'b #设计' }),
      makeNote({ content: 'c #写作' })
    ]
    const tree = buildTagTree(notes)
    expect(tree.map((node) => node.path)).toEqual(['设计', '写作'])
    expect(tree[0].count).toBe(2)
    expect(tree[0].children.map((node) => node.path)).toEqual(['设计/排版', '设计/配色'])
  })
})

describe('筛选与分组', () => {
  const pinned = makeNote({ content: '置顶 #设计/排版', pinned: true })
  const starred = makeNote({ content: '星标 #写作', starred: true })
  const plain = makeNote({ content: '普通 #设计/配色' })

  it('置顶优先排序，支持标签子树与搜索', () => {
    const result = filterNotes([plain, starred, pinned], {
      view: 'all',
      tag: '设计',
      query: ''
    })
    expect(result.map((note) => note.id)).toEqual([pinned.id, plain.id])

    const searched = filterNotes([plain, starred, pinned], {
      view: 'all',
      tag: null,
      query: '星标'
    })
    expect(searched.map((note) => note.id)).toEqual([starred.id])
  })

  it('按今天 / 昨天 / 月份分组', () => {
    const notes = [
      makeNote({ content: '今天' }),
      makeNote({ content: '昨天', createdAt: NOW - DAY }),
      makeNote({ content: '上个月', createdAt: new Date(2026, 8, 15, 10).getTime() })
    ]
    expect(groupNotesByDay(notes, NOW).map((group) => group.label)).toEqual([
      '今天',
      '昨天',
      '9 月'
    ])
  })

  it('置顶的旧灵感不会打乱日期分组顺序', () => {
    const notes = [
      makeNote({ content: '今天的普通灵感' }),
      makeNote({ content: '昨天的重要灵感', createdAt: NOW - DAY, pinned: true }),
      makeNote({ content: '今天的置顶灵感', pinned: true })
    ]
    const groups = groupNotesByDay(notes, NOW)
    expect(groups.map((group) => group.label)).toEqual(['今天', '昨天'])
    expect(groups[0].notes.map((note) => note.content)).toEqual([
      '今天的置顶灵感',
      '今天的普通灵感'
    ])
  })
})

describe('热力图', () => {
  it('统计当日数量与连续记录天数', () => {
    const notes = [
      makeNote({ content: '今天 1' }),
      makeNote({ content: '今天 2' }),
      makeNote({ content: '昨天', createdAt: NOW - DAY })
    ]
    const heatmap = buildHeatmap(notes, 16, NOW)
    const cells = heatmap.weeks.flatMap((week) => week.cells)
    const todayCell = cells.find((cell) => cell.title.includes('11 月 20 日'))
    expect(todayCell?.count).toBe(2)
    expect(calcStreak(notes, NOW)).toBe(2)
  })
})

describe('备份', () => {
  it('导出后可原样导入并重新解析标签', () => {
    const note = makeNote({ content: '一条灵感 #产品/灵感' })
    const parsed = parseBackup(createBackup([note]))
    expect(parsed).toHaveLength(1)
    expect(parsed[0].content).toBe(note.content)
    expect(parsed[0].tags).toEqual(['产品/灵感'])
  })

  it('拒绝无效备份', () => {
    expect(() => parseBackup('not-json')).toThrow()
    expect(() => parseBackup(JSON.stringify({ hello: 'world' }))).toThrow()
  })
})
