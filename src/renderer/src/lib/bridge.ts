import type { Note } from '../types'
import { createBackup, parseBackup } from './storage'

export type ExportOutcome =
  | { status: 'saved'; path?: string }
  | { status: 'canceled' }
  | { status: 'error'; message: string }

export type ImportOutcome =
  | { status: 'done'; notes: Note[] }
  | { status: 'canceled' }
  | { status: 'error'; message: string }

function desktopBridge(): Window['notesApi'] {
  return window.notesApi
}

export const isDesktopApp = typeof window !== 'undefined' && Boolean(window.notesApi)

export async function exportNotes(notes: Note[]): Promise<ExportOutcome> {
  const payload = createBackup(notes)
  const bridge = desktopBridge()

  if (bridge) {
    try {
      const result = await bridge.exportJson(payload)
      return result.canceled ? { status: 'canceled' } : { status: 'saved', path: result.filePath }
    } catch {
      return { status: 'error', message: '导出失败，请重试' }
    }
  }

  try {
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `inspira-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
    return { status: 'saved' }
  } catch {
    return { status: 'error', message: '导出失败，请重试' }
  }
}

export async function importNotes(): Promise<ImportOutcome> {
  const bridge = desktopBridge()

  if (bridge) {
    try {
      const result = await bridge.importJson()
      if (result.canceled) return { status: 'canceled' }
      if (result.error || !result.data) {
        return { status: 'error', message: result.error ?? '导入失败' }
      }
      return { status: 'done', notes: parseBackup(result.data) }
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : '导入失败'
      }
    }
  }

  return importFromFile()
}

function importFromFile(): Promise<ImportOutcome> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.style.display = 'none'

    let settled = false
    const finish = (outcome: ImportOutcome): void => {
      if (settled) return
      settled = true
      input.remove()
      resolve(outcome)
    }

    input.addEventListener('change', () => {
      const file = input.files?.[0]
      if (!file) {
        finish({ status: 'canceled' })
        return
      }
      file
        .text()
        .then((text) => finish({ status: 'done', notes: parseBackup(text) }))
        .catch(() =>
          finish({
            status: 'error',
            message: '读取文件失败'
          })
        )
    })

    window.addEventListener(
      'focus',
      () => {
        window.setTimeout(() => {
          if (!settled && (!input.files || input.files.length === 0)) {
            finish({ status: 'canceled' })
          }
        }, 400)
      },
      { once: true }
    )

    document.body.appendChild(input)
    input.click()
  })
}
