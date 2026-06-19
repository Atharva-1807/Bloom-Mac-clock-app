export interface ElectronAPI {
  quit: () => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
