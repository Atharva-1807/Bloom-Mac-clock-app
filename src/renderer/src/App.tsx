import { useEffect } from 'react'
import Clock from './Clock'

// Base window width (369px clock + 10px shadow bleed × 2)
const BASE_WIDTH = 389

export default function App(): JSX.Element {
  useEffect(() => {
    const updateZoom = (): void => {
      document.documentElement.style.zoom = String(window.innerWidth / BASE_WIDTH)
    }
    updateZoom()
    window.addEventListener('resize', updateZoom)
    return () => window.removeEventListener('resize', updateZoom)
  }, [])

  return (
    <div className="app-shell">
      <Clock />
    </div>
  )
}
