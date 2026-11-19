import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 纯浏览器预览配置，用于不启动 Electron 时调试渲染层
export default defineConfig({
  root: resolve(process.cwd(), 'src/renderer'),
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'src/renderer/src')
    }
  },
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true
  }
})
