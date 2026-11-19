import { Download, Layers3, Pin, ShieldCheck, Star, Upload } from 'lucide-react'
import type { HeatmapData } from '../lib/date'
import type { TagNode, ViewMode } from '../types'
import { BrandMark } from './BrandMark'
import { Heatmap } from './Heatmap'
import { TagTree } from './TagTree'

interface SidebarProps {
  view: ViewMode
  activeTag: string | null
  counts: { all: number; pinned: number; starred: number }
  tagTree: TagNode[]
  heatmap: HeatmapData
  onSelectView: (view: ViewMode) => void
  onSelectTag: (tag: string | null) => void
  onExport: () => void
  onImport: () => void
}

const NAV_ITEMS: Array<{
  view: ViewMode
  label: string
  icon: typeof Layers3
  countKey: 'all' | 'pinned' | 'starred'
}> = [
  { view: 'all', label: '全部灵感', icon: Layers3, countKey: 'all' },
  { view: 'pinned', label: '置顶', icon: Pin, countKey: 'pinned' },
  { view: 'starred', label: '星标', icon: Star, countKey: 'starred' }
]

export function Sidebar({
  view,
  activeTag,
  counts,
  tagTree,
  heatmap,
  onSelectView,
  onSelectTag,
  onExport,
  onImport
}: SidebarProps): JSX.Element {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <BrandMark size={19} />
        </span>
        <div className="brand-meta">
          <span className="brand-name">灵感便签</span>
          <span className="brand-sub">INSPIRA · IDEA KEEPER</span>
        </div>
      </div>

      <nav className="nav" aria-label="灵感视角">
        {NAV_ITEMS.map(({ view: itemView, label, icon: Icon, countKey }) => (
          <button
            key={itemView}
            type="button"
            className={`nav-item ${view === itemView && !activeTag ? 'is-active' : ''}`}
            onClick={() => onSelectView(itemView)}
          >
            <Icon size={15} className="nav-icon" />
            <span>{label}</span>
            <span className="nav-count">{counts[countKey]}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-section">
        <div className="section-head">
          <span className="section-title">标签</span>
          <span className="section-hint"># 自动归类</span>
        </div>
        <TagTree nodes={tagTree} activeTag={activeTag} onSelect={onSelectTag} />
      </div>

      <div className="sidebar-bottom">
        <Heatmap data={heatmap} />
        <div className="data-actions">
          <button type="button" className="data-btn" onClick={onImport} title="从 JSON 备份合并灵感">
            <Upload size={13} />
            导入
          </button>
          <button type="button" className="data-btn" onClick={onExport} title="导出全部灵感为 JSON 备份">
            <Download size={13} />
            导出
          </button>
        </div>
        <p className="local-note">
          <ShieldCheck size={11} />
          数据保存在本机
        </p>
      </div>
    </aside>
  )
}
