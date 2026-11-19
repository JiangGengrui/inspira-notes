import type { Note, TagNode } from '../types'

const TAG_PATTERN = /#([\p{L}\p{N}_-]+(?:\/[\p{L}\p{N}_-]+)*)/gu

export function parseTags(content: string): string[] {
  const result: string[] = []
  const seen = new Set<string>()
  for (const match of content.matchAll(TAG_PATTERN)) {
    const tag = match[1].replace(/^\/+|\/+$/g, '')
    if (!tag) continue
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(tag)
  }
  return result
}

export function stripTags(content: string): string {
  return content
    .replace(TAG_PATTERN, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

export function noteMatchesTag(note: Note, tag: string): boolean {
  const target = tag.toLowerCase()
  return note.tags.some((item) => {
    const value = item.toLowerCase()
    return value === target || value.startsWith(`${target}/`)
  })
}

export function buildTagTree(notes: Note[]): TagNode[] {
  const root: TagNode = { path: '', name: '', count: 0, children: [] }
  const index = new Map<string, TagNode>()

  for (const note of notes) {
    const counted = new Set<string>()
    for (const tag of note.tags) {
      const parts = tag.split('/').filter(Boolean)
      let prefix = ''
      for (const part of parts) {
        prefix = prefix ? `${prefix}/${part}` : part
        let node = index.get(prefix)
        if (!node) {
          node = { path: prefix, name: part, count: 0, children: [] }
          index.set(prefix, node)
          const parentPath = prefix.includes('/') ? prefix.slice(0, prefix.lastIndexOf('/')) : ''
          const parent = parentPath ? index.get(parentPath) ?? root : root
          parent.children.push(node)
        }
        if (!counted.has(prefix)) {
          node.count += 1
          counted.add(prefix)
        }
      }
    }
  }

  const sortNodes = (nodes: TagNode[]): void => {
    nodes.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh'))
    nodes.forEach((node) => sortNodes(node.children))
  }
  sortNodes(root.children)

  return root.children
}

const TAG_HUES = [12, 32, 52, 96, 154, 190, 216, 258, 292, 330]

export function tagHue(tag: string): number {
  let hash = 0
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0
  }
  return TAG_HUES[hash % TAG_HUES.length]
}
