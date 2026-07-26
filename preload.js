const { contextBridge } = require('electron');

// 暴露一个安全的 API 给渲染进程（后续如需本地存储可扩展）
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});
