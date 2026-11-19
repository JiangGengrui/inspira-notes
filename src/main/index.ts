import { app, BrowserWindow, dialog, ipcMain, nativeTheme, shell } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'

const MAX_IMPORT_BYTES = 5 * 1024 * 1024

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1180,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: '灵感便签',
    icon,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0e0f13' : '#f4efe6',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.once('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpc(): void {
  ipcMain.handle('notes:export', async (_event, payload: string) => {
    if (typeof payload !== 'string' || payload.length === 0) {
      return { canceled: true }
    }
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    const stamp = new Date().toISOString().slice(0, 10)
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: '导出灵感备份',
      defaultPath: `inspira-backup-${stamp}.json`,
      filters: [{ name: '灵感便签备份', extensions: ['json'] }]
    })
    if (canceled || !filePath) return { canceled: true }
    await writeFile(filePath, payload, 'utf-8')
    return { canceled: false, filePath }
  })

  ipcMain.handle('notes:import', async () => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: '导入灵感备份',
      properties: ['openFile'],
      filters: [{ name: '灵感便签备份', extensions: ['json'] }]
    })
    if (canceled || filePaths.length === 0) return { canceled: true }

    try {
      const stat = await import('fs/promises').then((fs) => fs.stat(filePaths[0]))
      if (stat.size > MAX_IMPORT_BYTES) return { canceled: false, error: '文件过大（上限 5 MB）' }
      const data = await readFile(filePaths[0], 'utf-8')
      return { canceled: false, data }
    } catch {
      return { canceled: false, error: '读取文件失败' }
    }
  })
}

app.whenReady().then(() => {
  app.setName('灵感便签')
  registerIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
