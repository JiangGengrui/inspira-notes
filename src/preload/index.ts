import { contextBridge, ipcRenderer } from 'electron'

export interface ExportResult {
  canceled: boolean
  filePath?: string
}

export interface ImportResult {
  canceled: boolean
  data?: string
  error?: string
}

const notesApi = {
  platform: process.platform,
  exportJson: (json: string): Promise<ExportResult> => ipcRenderer.invoke('notes:export', json),
  importJson: (): Promise<ImportResult> => ipcRenderer.invoke('notes:import')
}

export type NotesApi = typeof notesApi

contextBridge.exposeInMainWorld('notesApi', notesApi)
