/// <reference types="vite/client" />

interface Window {
  notesApi?: {
    platform: string
    exportJson(json: string): Promise<{ canceled: boolean; filePath?: string }>
    importJson(): Promise<{ canceled: boolean; data?: string; error?: string }>
  }
}
