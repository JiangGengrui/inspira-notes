import { useState, type CSSProperties } from 'react'
import { ChevronRight } from 'lucide-react'
import type { TagNode } from '../types'
import { tagHue } from '../lib/tags'

interface TagTreeProps {
  nodes: TagNode[]
  activeTag: string | null
  onSelect: (tag: string | null) => void
}

export function TagTree({ nodes, activeTag, onSelect }: TagTreeProps): JSX.Element {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggle = (path: string): void => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  if (nodes.length === 0) {
    return <p className="tag-empty">在正文里写下 #标签，就会在这里长出标签树</p>
  }

  return (
    <div className="tag-tree">
      {nodes.map((node) => (
        <TagBranch
          key={node.path}
          node={node}
          depth={0}
          activeTag={activeTag}
          collapsed={collapsed}
          onToggle={toggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

interface TagBranchProps {
  node: TagNode
  depth: number
  activeTag: string | null
  collapsed: Set<string>
  onToggle: (path: string) => void
  onSelect: (tag: string | null) => void
}

function TagBranch({
  node,
  depth,
  activeTag,
  collapsed,
  onToggle,
  onSelect
}: TagBranchProps): JSX.Element {
  const open = !collapsed.has(node.path)
  const isActive = activeTag === node.path
  const hasChildren = node.children.length > 0

  return (
    <div className="tag-branch">
      <div
        className={`tag-row ${isActive ? 'is-active' : ''}`}
        style={{ paddingLeft: `${6 + depth * 13}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="tag-chevron"
            onClick={() => onToggle(node.path)}
            aria-label={open ? `折叠 ${node.name}` : `展开 ${node.name}`}
            aria-expanded={open}
          >
            <ChevronRight size={12} className={open ? 'is-open' : ''} />
          </button>
        ) : (
          <span className="tag-chevron is-leaf" aria-hidden="true" />
        )}
        <button
          type="button"
          className="tag-label"
          onClick={() => onSelect(isActive ? null : node.path)}
          title={`筛选 #${node.path}`}
        >
          <span
            className="tag-dot"
            style={{ '--tag-hue': tagHue(node.path) } as CSSProperties}
            aria-hidden="true"
          />
          <span className="tag-name">{node.name}</span>
          <span className="tag-count">{node.count}</span>
        </button>
      </div>
      {hasChildren && open && (
        <div className="tag-children">
          {node.children.map((child) => (
            <TagBranch
              key={child.path}
              node={child}
              depth={depth + 1}
              activeTag={activeTag}
              collapsed={collapsed}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
