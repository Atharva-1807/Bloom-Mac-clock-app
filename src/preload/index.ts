import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  quit: (): void => ipcRenderer.send('quit-app'),
  resizeWindow: (width: number, height: number): void =>
    ipcRenderer.send('resize-window', width, height)
})
