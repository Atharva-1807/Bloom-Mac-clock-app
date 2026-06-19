import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  quit: (): void => ipcRenderer.send('quit-app')
})
