import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Info, Moon, Search, Shuffle, Sun, Trash2, X } from 'lucide-react'
import { Composer } from './components/Composer'
import { EditorDialog } from './components/EditorDialog'
import { EmptyState } from './components/EmptyState'
import { NoteCard } from './components/NoteCard'
import { ReviewDialog } from './components/ReviewDialog'
import { Sidebar } from './components/Sidebar'
import { Toast } from './components/Toast'
import { exportNotes, importNotes, isDesktopApp } from './lib/bridge'
import { buildHeatmap, dateKey, groupNotesByDay } from './lib/date'
import { filterNotes } from './lib/filters'
import { buildTagTree } from './lib/tags'
import { useTheme } from './lib/theme'
import { NotesProvider, useNotes } from './store/notes'
import type { Note, ViewMode } from './types'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return '夜深了，灵感仍在游荡'
  if (hour < 11) return '早上好，灵感收集者'
  if (hour < 14) return '午后好，灵感收集者'
  if (hour < 18) return '下午好，灵感收集者'
  return '晚上好，灵感收集者'
}

function Workspace(): JSX.Element {
  const { notes, undo, removeNote, restoreUndo, dismissUndo, replaceNotes } = useNotes()
  const { theme, toggleTheme } = useTheme()
  const [view, setView] = useState<ViewMode>('all')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Note | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const counts = useMemo(
    () => ({
      all: notes.length,
      pinned: notes.filter((note) => note.pinned).length,
      starred: notes.filter((note) => note.starred).length
    }),
    [notes]
  )
  const tagTree = useMemo(() => buildTagTree(notes), [notes])
  const heatmap = useMemo(() => buildHeatmap(notes), [notes])
  const filtered = useMemo(
    () => filterNotes(notes, { view, tag: activeTag, query }),
    [notes, view, activeTag, query]
  )
  const groups = useMemo(() => groupNotesByDay(filtered), [filtered])
  const todayCount = useMemo(() => {
    const today = dateKey(Date.now())
    return notes.filter((note) => dateKey(note.createdAt) === today).length
  }, [notes])

  const subtitle = useMemo(() => {
    if (query.trim()) return `在灵感里寻找「${query.trim()}」`
    if (activeTag) return `正在翻看 #${activeTag} 的线索`
    if (todayCount > 0) return `今天已经收下 ${todayCount} 个灵光`
    return '今天还没有记录，第一个念头随时会来'
  }, [query, activeTag, todayCount])

  const handleSelectView = useCallback((next: ViewMode): void => {
    setView(next)
    setActiveTag(null)
  }, [])

  const handleSelectTag = useCallback((tag: string | null): void => {
    setActiveTag(tag)
    setView('all')
  }, [])

  const handleEdit = useCallback((note: Note): void => setEditing(note), [])
  const handleCloseEditor = useCallback((): void => setEditing(null), [])

  const handleExport = useCallback(async (): Promise<void> => {
    const result = await exportNotes(notes)
    if (result.status === 'saved') setNotice('已导出全部灵感备份')
    else if (result.status === 'error') setNotice(result.message)
  }, [notes])

  const handleImport = useCallback(async (): Promise<void> => {
    const result = await importNotes()
    if (result.status === 'canceled') return
    if (result.status === 'error') {
      setNotice(result.message)
      return
    }
    if (result.notes.length === 0) {
      setNotice('这份备份里没有便签')
      return
    }
    const merged = new Map(notes.map((note) => [note.id, note]))
    for (const note of result.notes) merged.set(note.id, note)
    replaceNotes(Array.from(merged.values()))
    setEditing(null)
    setNotice(`已合并 ${result.notes.length} 条灵感`)
  }, [notes, replaceNotes])

  useEffect(() => {
    if (!undo) return
    const timer = window.setTimeout(dismissUndo, 6_000)
    return () => window.clearTimeout(timer)
  }, [undo, dismissUndo])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 3_200)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!(event.ctrlKey || event.metaKey)) return
      const key = event.key.toLowerCase()
      if (key === 'n') {
        event.preventDefault()
        composerRef.current?.focus()
      } else if (key === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const shortcutSymbol = isDesktopApp && window.notesApi?.platform === 'darwin' ? '⌘' : 'Ctrl'
  const focusComposer = (): void => composerRef.current?.focus()
  const clearFilters = (): void => {
    setView('all')
    setActiveTag(null)
    setQuery('')
  }

  const emptyView =
    notes.length === 0 ? (
      <EmptyState
        title="还没有灵感入袋"
        description="每一个大想法，都始于一个随手记下的念头。写下第一条吧。"
        actionLabel="写下第一条"
        onAction={focusComposer}
      />
    ) : query.trim() ? (
      <EmptyState
        title={`没有找到「${query.trim()}」`}
        description="换个关键词试试，或清空搜索回到全部灵感。"
        actionLabel="清空搜索"
        onAction={() => setQuery('')}
      />
    ) : (
      <EmptyState
        title="这个视角下暂无线索"
        description="试着切换筛选，或者写下新的灵感让它在这里生长。"
        actionLabel="回到全部"
        onAction={clearFilters}
      />
    )

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        activeTag={activeTag}
        counts={counts}
        tagTree={tagTree}
        heatmap={heatmap}
        onSelectView={handleSelectView}
        onSelectTag={handleSelectTag}
        onExport={() => void handleExport()}
        onImport={() => void handleImport()}
      />

      <main className="main">
        <header className="topbar">
          <div className="greeting">
            <h1>{greeting()}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="topbar-actions">
            <label className="search">
              <Search size={14} />
              <input
                ref={searchRef}
                value={query}
                placeholder="搜索灵感…"
                aria-label="搜索灵感"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setQuery('')
                    event.currentTarget.blur()
                  }
                }}
              />
              <kbd>{shortcutSymbol} K</kbd>
            </label>
            <button
              type="button"
              className="ghost-btn review-trigger"
              disabled={notes.length === 0}
              title="随机重逢一条旧灵感"
              onClick={() => setReviewOpen(true)}
            >
              <Shuffle size={14} />
              <span>灵感回顾</span>
            </button>
            <button
              type="button"
              className="icon-btn theme-toggle"
              title={theme === 'light' ? '切换到夜间主题' : '切换到日间主题'}
              aria-label={theme === 'light' ? '切换到夜间主题' : '切换到日间主题'}
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          </div>
        </header>

        <Composer inputRef={composerRef} />

        <div className="stream">
          <div className="filter-row">
            <div className="filters" role="group" aria-label="筛选">
              <button
                type="button"
                className={`filter-chip ${view === 'all' && !activeTag ? 'is-active' : ''}`}
                onClick={() => handleSelectView('all')}
              >
                全部
              </button>
              <button
                type="button"
                className={`filter-chip ${view === 'pinned' ? 'is-active' : ''}`}
                onClick={() => handleSelectView('pinned')}
              >
                置顶
              </button>
              <button
                type="button"
                className={`filter-chip ${view === 'starred' ? 'is-active' : ''}`}
                onClick={() => handleSelectView('starred')}
              >
                星标
              </button>
              {activeTag && (
                <button
                  type="button"
                  className="filter-chip is-tag"
                  title="清除标签筛选"
                  onClick={() => setActiveTag(null)}
                >
                  #{activeTag}
                  <X size={11} />
                </button>
              )}
            </div>
            <span className="result-meta">{filtered.length} 条灵感</span>
          </div>

          <div className="groups-scroll">
            <AnimatePresence initial={false}>
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {emptyView}
                </motion.div>
              ) : (
                groups.map((group) => (
                  <motion.section
                    className="note-group"
                    key={group.key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="group-head">
                      <h2 className="group-label">{group.label}</h2>
                      <span className="group-count">{group.notes.length}</span>
                      <span className="group-rule" />
                    </div>
                    <div className="masonry">
                      <AnimatePresence initial={false}>
                        {group.notes.map((note, index) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            index={index}
                            query={query}
                            onEdit={handleEdit}
                            onDelete={(item) => removeNote(item.id)}
                            onTagClick={(tag) => handleSelectTag(tag)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.section>
                ))
              )}
            </AnimatePresence>
            {filtered.length > 0 && (
              <div className="stream-end">
                <span>灵感会自己生长</span>
              </div>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {editing && <EditorDialog key={editing.id} note={editing} onClose={handleCloseEditor} />}
      </AnimatePresence>

      <AnimatePresence>
        {reviewOpen && notes.length > 0 && (
          <ReviewDialog key="review" notes={notes} onClose={() => setReviewOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {undo ? (
          <Toast
            key="undo"
            message="这条灵感已删除"
            actionLabel="撤销"
            onAction={restoreUndo}
            icon={<Trash2 size={14} />}
          />
        ) : notice ? (
          <Toast key="notice" message={notice} icon={<Info size={14} />} />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default function App(): JSX.Element {
  return (
    <NotesProvider>
      <Workspace />
    </NotesProvider>
  )
}
