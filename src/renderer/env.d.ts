export interface ElectronAPI {
  quit: () => void
  resizeWindow: (width: number, height: number) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
