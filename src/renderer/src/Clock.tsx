import React, { useEffect, useRef, useState } from 'react'
import { ClockState, formatDate, formatDay, formatTime, getClockState } from './utils/timeOfDay'
import './Clock.css'

type ViewMode  = 'clock' | 'timer'
type EditSeg   = 'h' | 'm' | 's'

const ALL_STATES: ClockState[] = ['sunrise', 'day', 'sunset', 'night']
const SEG_MAX: Record<EditSeg, number> = { h: 99, m: 59, s: 59 }
const SEG_NEXT: Record<EditSeg, EditSeg | null> = { h: 'm', m: 's', s: null }
const SEG_PREV: Record<EditSeg, EditSeg | null> = { h: null, m: 'h', s: 'm' }

function pad2(n: number): string { return String(n).padStart(2, '0') }

function formatTimer(ms: number): string {
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1_000)
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

export default function Clock(): JSX.Element {
  const [now, setNow] = useState(() => new Date())
  const state = getClockState(now)

  // ── View toggle ────────────────────────────────────────────────────
  const [view, setView] = useState<ViewMode>('clock')

  // ── Timer state ────────────────────────────────────────────────────
  const [timerTotal, setTimerTotal] = useState(0)
  const [timerMs,    setTimerMs   ] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)

  // ── Segment-edit state ─────────────────────────────────────────────
  // editSeg: which segment is selected (null = not editing)
  // editH/M/S: the three values being composed
  // segBuf: digits typed so far for the active segment
  const [editSeg, setEditSeg] = useState<EditSeg | null>(null)
  const [editH, setEditH] = useState(0)
  const [editM, setEditM] = useState(0)
  const [editS, setEditS] = useState(0)
  const [segBuf, setSegBuf] = useState('')

  // Hidden <input> that holds keyboard focus while editing
  const hiddenRef = useRef<HTMLInputElement>(null)

  // Refs for event handlers that need non-stale values
  const swipeCooldown = useRef(false)
  const wheelAcc      = useRef(0)
  const editSegRef    = useRef<EditSeg | null>(null)
  const timerTotalRef = useRef(0)
  editSegRef.current  = editSeg
  timerTotalRef.current = timerTotal

  // ── Clock tick ─────────────────────────────────────────────────────
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  // ── Double-click to quit ───────────────────────────────────────────
  useEffect(() => {
    const quit = (): void => window.electronAPI?.quit()
    window.addEventListener('dblclick', quit)
    return () => window.removeEventListener('dblclick', quit)
  }, [])

  // ── Wheel swipe — accumulated deltaY ──────────────────────────────
  useEffect(() => {
    let resetTimer: ReturnType<typeof setTimeout> | null = null
    const onWheel = (e: WheelEvent): void => {
      if (editSegRef.current !== null) return   // ignore while editing

      wheelAcc.current += e.deltaY
      if (resetTimer) clearTimeout(resetTimer)
      resetTimer = setTimeout(() => { wheelAcc.current = 0 }, 150)

      if (swipeCooldown.current) return
      if (wheelAcc.current > 60) {
        setView('timer'); swipeCooldown.current = true; wheelAcc.current = 0
        setTimeout(() => { swipeCooldown.current = false }, 550)
      } else if (wheelAcc.current < -60) {
        setView('clock'); swipeCooldown.current = true; wheelAcc.current = 0
        setTimeout(() => { swipeCooldown.current = false }, 550)
      }
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => { window.removeEventListener('wheel', onWheel); if (resetTimer) clearTimeout(resetTimer) }
  }, [])

  // ── Timer countdown tick ───────────────────────────────────────────
  useEffect(() => {
    if (!timerRunning) return
    const id = window.setInterval(() => {
      setTimerMs((prev) => {
        if (timerTotalRef.current > 0) {
          if (prev <= 10) { setTimerRunning(false); return 0 }
          return prev - 10
        }
        return prev + 10
      })
    }, 10)
    return () => window.clearInterval(id)
  }, [timerRunning])

  // ── Focus hidden input whenever a segment becomes active ───────────
  useEffect(() => {
    if (editSeg !== null) hiddenRef.current?.focus()
  }, [editSeg])

  // ── Segment helpers ────────────────────────────────────────────────
  const commitSegBuf = (seg: EditSeg, buf: string, h: number, m: number, s: number) => {
    if (buf === '') return { h, m, s }
    const val = Math.min(parseInt(buf), SEG_MAX[seg])
    return { h: seg === 'h' ? val : h, m: seg === 'm' ? val : m, s: seg === 's' ? val : s }
  }

  const openEdit = (seg: EditSeg) => {
    if (timerRunning) return
    // Pre-fill with currently set time
    const src = timerTotal > 0 ? timerTotal : 0
    setEditH(Math.floor(src / 3_600_000))
    setEditM(Math.floor((src % 3_600_000) / 60_000))
    setEditS(Math.floor((src % 60_000) / 1_000))
    setSegBuf('')
    setEditSeg(seg)
  }

  const cancelEdit = () => { setEditSeg(null); setSegBuf('') }

  const startTimer = (h: number, m: number, s: number) => {
    const ms = (h * 3600 + m * 60 + s) * 1000
    setEditSeg(null); setSegBuf('')
    if (ms > 0) { setTimerTotal(ms); setTimerMs(ms); setTimerRunning(true) }
  }

  // ── Hidden input key handler — the core of the edit UX ────────────
  const onHiddenKey = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (editSeg === null) return
    e.preventDefault()

    if (/^\d$/.test(e.key)) {
      const digit = e.key
      const newBuf = segBuf + digit
      const max    = SEG_MAX[editSeg]

      if (newBuf.length === 1) {
        // Auto-advance after 1st digit when it can only produce a valid 1-digit value
        // e.g. "7" for seconds (max 59) → 70 > 59, so commit "7" and advance
        if (parseInt(digit) * 10 > max) {
          const vals = commitSegBuf(editSeg, digit, editH, editM, editS)
          setEditH(vals.h); setEditM(vals.m); setEditS(vals.s)
          setSegBuf('')
          const next = SEG_NEXT[editSeg]
          if (next) setEditSeg(next)
          else startTimer(vals.h, vals.m, vals.s)
        } else {
          setSegBuf(newBuf)
        }
      } else {
        // 2nd digit → commit + auto-advance
        const vals = commitSegBuf(editSeg, newBuf, editH, editM, editS)
        setEditH(vals.h); setEditM(vals.m); setEditS(vals.s)
        setSegBuf('')
        const next = SEG_NEXT[editSeg]
        if (next) setEditSeg(next)
        else startTimer(vals.h, vals.m, vals.s)
      }
    } else if (e.key === 'Backspace') {
      if (segBuf.length > 0) {
        setSegBuf(segBuf.slice(0, -1))
      } else {
        const prev = SEG_PREV[editSeg]
        if (prev) setEditSeg(prev)
      }
    } else if (e.key === 'Tab') {
      if (e.shiftKey) {
        const prev = SEG_PREV[editSeg]
        if (prev) { const v = commitSegBuf(editSeg, segBuf, editH, editM, editS); setEditH(v.h); setEditM(v.m); setEditS(v.s); setSegBuf(''); setEditSeg(prev) }
      } else {
        const next = SEG_NEXT[editSeg]
        if (next) { const v = commitSegBuf(editSeg, segBuf, editH, editM, editS); setEditH(v.h); setEditM(v.m); setEditS(v.s); setSegBuf(''); setEditSeg(next) }
      }
    } else if (e.key === 'ArrowRight') {
      const next = SEG_NEXT[editSeg]
      if (next) { const v = commitSegBuf(editSeg, segBuf, editH, editM, editS); setEditH(v.h); setEditM(v.m); setEditS(v.s); setSegBuf(''); setEditSeg(next) }
    } else if (e.key === 'ArrowLeft') {
      const prev = SEG_PREV[editSeg]
      if (prev) { const v = commitSegBuf(editSeg, segBuf, editH, editM, editS); setEditH(v.h); setEditM(v.m); setEditS(v.s); setSegBuf(''); setEditSeg(prev) }
    } else if (e.key === 'Enter') {
      const v = commitSegBuf(editSeg, segBuf, editH, editM, editS)
      startTimer(v.h, v.m, v.s)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  // ── Segment display value ──────────────────────────────────────────
  const segDisp = (seg: EditSeg, val: number) =>
    editSeg === seg ? segBuf.padStart(2, '0') : pad2(val)

  const nodrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties
  const isEditing = editSeg !== null

  return (
    <div className={`clock clock--${state} clock--view-${view}`}>
      {ALL_STATES.map((s) => (
        <div key={s} className={`clock__bg clock__bg--${s}`} style={{ opacity: state === s ? 1 : 0 }} aria-hidden />
      ))}

      <div className="clock__cloud clock__cloud--back" aria-hidden><CloudBackSVG /></div>
      <div className="clock__cloud clock__cloud--front" aria-hidden><CloudFrontSVG /></div>
      <div className="clock__stars" aria-hidden><StarsSVG /></div>

      <div className="clock__celestial-group" aria-hidden>
        <div className="clock__rays">
          <div className="clock__ray clock__ray--3" />
          <div className="clock__ray clock__ray--2" />
          <div className="clock__ray clock__ray--1" />
        </div>
        <div className="clock__pill">
          <div className="clock__sun-face"><SunSVG /></div>
          <div className="clock__moon-face"><MoonSpotsSVG /></div>
        </div>
      </div>

      <div className="clock__content-slider">
        <div className="clock__content-track">

          {/* Panel 0 — Clock */}
          <div className="clock__panel">
            <div className="clock__text" style={nodrag}>
              <p className="clock__time">{formatTime(now)}</p>
              <div className="clock__meta">
                <span className="clock__date">{formatDate(now)}</span>
                <span className="clock__dot" aria-hidden />
                <span className="clock__day">{formatDay(now)}</span>
              </div>
            </div>
          </div>

          {/* Panel 1 — Timer */}
          <div className="clock__panel">
            <div className="clock__timer" style={nodrag}>

              {/* Hidden input — holds real keyboard focus while editing */}
              <input
                ref={hiddenRef}
                className="clock__timer-hidden-input"
                onKeyDown={onHiddenKey}
                readOnly
                value=""
                aria-hidden
                tabIndex={-1}
              />

              {/* Display: segments in edit mode, plain text otherwise */}
              {isEditing ? (
                <div className="clock__timer-segs">
                  {(['h','m','s'] as EditSeg[]).map((seg, i) => (
                    <React.Fragment key={seg}>
                      {i > 0 && <span className="clock__timer-colon">:</span>}
                      <span
                        className={`clock__timer-seg${editSeg === seg ? ' clock__timer-seg--active' : ''}`}
                        onClick={() => { const v = commitSegBuf(editSeg!, segBuf, editH, editM, editS); setEditH(v.h); setEditM(v.m); setEditS(v.s); setSegBuf(''); setEditSeg(seg); hiddenRef.current?.focus() }}
                      >
                        {segDisp(seg, seg === 'h' ? editH : seg === 'm' ? editM : editS)}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p
                  className="clock__timer-display"
                  onClick={() => openEdit('h')}
                  title={timerRunning ? undefined : 'Click to set time'}
                >
                  {formatTimer(timerMs)}
                </p>
              )}

              {/* Controls */}
              {isEditing ? (
                /* Edit mode: confirm or cancel */
                <div className="clock__timer-btns">
                  <button className="clock__timer-btn" onClick={() => { const v = commitSegBuf(editSeg!, segBuf, editH, editM, editS); startTimer(v.h, v.m, v.s) }} aria-label="Start">
                    <PlaySVG />
                  </button>
                  <button className="clock__timer-btn" onClick={cancelEdit} aria-label="Cancel">
                    <ResetSVG />
                  </button>
                </div>
              ) : timerRunning ? (
                /* Running: restart from set time or pause */
                <div className="clock__timer-btns">
                  <button className="clock__timer-btn" onClick={() => { setTimerRunning(false); setTimerMs(timerTotal) }} aria-label="Restart">
                    <ResetSVG />
                  </button>
                  <button className="clock__timer-btn" onClick={() => setTimerRunning(false)} aria-label="Pause">
                    <PauseSVG />
                  </button>
                </div>
              ) : timerMs > 0 ? (
                /* Paused: resume or reset to zero */
                <div className="clock__timer-btns">
                  <button className="clock__timer-btn" onClick={() => setTimerRunning(true)} aria-label="Resume">
                    <PlaySVG />
                  </button>
                  <button className="clock__timer-btn clock__timer-btn--reset-zero" onClick={() => { setTimerMs(0); setTimerTotal(0) }} aria-label="Reset to zero">
                    <ResetZeroSVG />
                  </button>
                </div>
              ) : (
                /* Idle: open edit to set a time */
                <button className="clock__timer-btn" onClick={() => openEdit('h')} aria-label="Set timer">
                  <PlaySVG />
                </button>
              )}

            </div>
          </div>

        </div>
      </div>

      <div className="clock__inset-shadow" aria-hidden />
    </div>
  )
}

function SunSVG(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="99"
      height="100"
      viewBox="0 0 99 100"
      fill="none"
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      <defs>
        <filter
          id="sun-fx"
          x="-4"
          y="-4"
          width="116"
          height="119"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="4" dy="7" />
          <feGaussianBlur stdDeviation="4" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="dd1" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="dd1" result="dd2" />
          <feBlend mode="normal" in="SourceGraphic" in2="dd2" result="shape" />
          {/* Inner highlight — warm yellow shimmer */}
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="3" dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 0.981078 0 0 0 0 0.621563 0 0 0 0.78 0"
          />
          <feBlend mode="normal" in2="shape" result="is1" />
          {/* Inner shadow — dark amber edge at top */}
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="-4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.248047 0 0 0 0 0.229432 0 0 0 0 0.0618999 0 0 0 0.39 0"
          />
          <feBlend mode="normal" in2="is1" result="is2" />
        </filter>
      </defs>
      <g filter="url(#sun-fx)">
        <circle cx="50" cy="50" r="50" fill="#FFC943" />
      </g>
    </svg>
  )
}

function MoonSpotsSVG(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="52"
      height="65"
      viewBox="0 0 52 65"
      fill="none"
      style={{ display: 'block' }}
    >
      <defs>
        <filter
          id="spot-fx-0"
          x="31"
          y="0"
          width="21"
          height="22"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="shape" result="is" />
        </filter>
        <filter
          id="spot-fx-1"
          x="12"
          y="27"
          width="38"
          height="39"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="shape" result="is" />
        </filter>
        <filter
          id="spot-fx-2"
          x="0"
          y="11"
          width="12"
          height="13"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="shape" result="is" />
        </filter>
      </defs>
      <g filter="url(#spot-fx-0)">
        <circle cx="41.5" cy="10.5" r="10.5" fill="#A2A0BA" fillOpacity="0.5" />
      </g>
      <g filter="url(#spot-fx-1)">
        <circle cx="31" cy="46" r="19" fill="#A2A0BA" fillOpacity="0.5" />
      </g>
      <g filter="url(#spot-fx-2)">
        <circle cx="6" cy="17" r="6" fill="#A2A0BA" fillOpacity="0.5" />
      </g>
    </svg>
  )
}

/* ── Timer button icons ──────────────────────────────────────────── */
function PlaySVG(): JSX.Element {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 5.5C8 4.4 9.2 3.77 10.14 4.36L19.1 9.86C20 10.42 20 11.58 19.1 12.14L10.14 17.64C9.2 18.23 8 17.6 8 16.5V5.5Z"
        fill="white"
        fillOpacity="0.92"
      />
    </svg>
  )
}

function PauseSVG(): JSX.Element {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="4" width="5" height="16" rx="1.5" fill="white" fillOpacity="0.92" />
      <rect x="14" y="4" width="5" height="16" rx="1.5" fill="white" fillOpacity="0.92" />
    </svg>
  )
}

function ResetSVG(): JSX.Element {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="14" height="14" rx="3" fill="white" fillOpacity="0.92" />
    </svg>
  )
}

/* Circular-arrow reset-to-zero icon from Figma node 568-1018 */
function ResetZeroSVG(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="58 58 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M70 68.6L72.5 71.1C72.6833 71.2833 72.775 71.5167 72.775 71.8C72.775 72.0833 72.6833 72.3167 72.5 72.5C72.3167 72.6833 72.0833 72.775 71.8 72.775C71.5167 72.775 71.2833 72.6833 71.1 72.5L68.3 69.7C68.2 69.6 68.125 69.4873 68.075 69.362C68.025 69.2373 68 69.1083 68 68.975V65C68 64.7167 68.096 64.479 68.288 64.287C68.4793 64.0957 68.7167 64 69 64C69.2833 64 69.521 64.0957 69.713 64.287C69.9043 64.479 70 64.7167 70 65V68.6ZM69 78C66.9833 78 65.175 77.404 63.575 76.212C61.975 75.0207 60.9 73.4667 60.35 71.55C60.2667 71.25 60.296 70.9667 60.438 70.7C60.5793 70.4333 60.8 70.2667 61.1 70.2C61.3833 70.1333 61.6377 70.1957 61.863 70.387C62.0877 70.579 62.2417 70.8167 62.325 71.1C62.7583 72.5667 63.596 73.75 64.838 74.65C66.0793 75.55 67.4667 76 69 76C70.95 76 72.604 75.3207 73.962 73.962C75.3207 72.604 76 70.95 76 69C76 67.05 75.3207 65.3957 73.962 64.037C72.604 62.679 70.95 62 69 62C67.85 62 66.775 62.2667 65.775 62.8C64.775 63.3333 63.9333 64.0667 63.25 65H65C65.2833 65 65.521 65.0957 65.713 65.287C65.9043 65.479 66 65.7167 66 66C66 66.2833 65.9043 66.5207 65.713 66.712C65.521 66.904 65.2833 67 65 67H61C60.7167 67 60.4793 66.904 60.288 66.712C60.096 66.5207 60 66.2833 60 66V62C60 61.7167 60.096 61.479 60.288 61.287C60.4793 61.0957 60.7167 61 61 61C61.2833 61 61.521 61.0957 61.713 61.287C61.9043 61.479 62 61.7167 62 62V63.35C62.85 62.2833 63.8877 61.4583 65.113 60.875C66.3377 60.2917 67.6333 60 69 60C70.25 60 71.421 60.2373 72.513 60.712C73.6043 61.1873 74.5543 61.829 75.363 62.637C76.171 63.4457 76.8127 64.3957 77.288 65.487C77.7627 66.579 78 67.75 78 69C78 70.25 77.7627 71.4207 77.288 72.512C76.8127 73.604 76.171 74.554 75.363 75.362C74.5543 76.1707 73.6043 76.8127 72.513 77.288C71.421 77.7627 70.25 78 69 78Z"
        fill="white"
      />
    </svg>
  )
}

/*
  Cloud paths from Figma — same shape for every state.
  viewBox covers the full path bounds (path coordinates extend beyond the
  Figma-export viewBox of "0 0 327 72", so we use a corrected box that
  captures all anchor/control points). preserveAspectRatio="none" fills
  the element dimensions exactly as Figma specifies.
*/
function CloudFrontSVG(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="375.781"
      height="198.277"
      viewBox="0 0 396 147"
      preserveAspectRatio="none"
      fill="none"
      style={{ display: 'block' }}
    >
      <path
        d="M346.212 1.14384C376.039 7.15846 395.545 35.2099 389.781 63.7987C384.016 92.3876 355.163 110.688 325.336 104.674C323.615 104.327 321.929 103.906 320.28 103.417C312.192 120.044 293.029 129.712 273.316 125.737C260.432 123.139 250.023 115.258 244.074 104.956C235.619 120.739 216.974 129.768 197.81 125.903C189.271 124.182 181.821 120.138 176.034 114.609C166.327 125.068 151.192 130.356 135.718 127.235C118.353 123.734 105.482 110.638 101.97 94.9472C99.0755 95.2662 96.0714 95.1514 93.0473 94.5416C89.9552 93.9181 87.0823 92.8265 84.4924 91.3621C85.876 96.9246 86.0802 102.835 84.8824 108.775C80.3941 131.034 57.93 145.282 34.7073 140.599C11.485 135.916 -3.7023 114.076 0.785974 91.8175C5.27431 69.559 27.7386 55.3107 50.961 59.9931C58.4273 61.4987 65.0616 64.7803 70.4799 69.2767C70.3631 67.1379 70.5104 64.9556 70.9517 62.7669C73.8753 48.2682 88.5079 38.9867 103.635 42.0369C110.529 43.4271 116.336 47.1399 120.338 52.1414C129.339 46.5991 140.563 44.3288 151.972 46.6293C160.51 48.3509 167.96 52.3944 173.747 57.9229C183.454 47.4636 198.59 42.1771 214.063 45.2973C226.947 47.8952 237.355 55.7757 243.304 66.077C250.545 52.5629 265.257 44.0035 281.368 44.2483C281.484 43.5058 281.616 42.7619 281.766 42.0183C287.531 13.4294 316.385 -4.87059 346.212 1.14384Z"
        fill="#F3FDFF"
        fillOpacity="0.87451"
      />
    </svg>
  )
}

function CloudBackSVG(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="360.669"
      height="185.913"
      viewBox="0 0 380 140"
      preserveAspectRatio="none"
      fill="none"
      style={{ display: 'block' }}
    >
      <path
        d="M323.553 1.22725C356.363 7.84315 377.686 39.3624 371.18 71.6272C364.674 103.892 332.802 124.684 299.993 118.068C297.004 117.465 294.112 116.654 291.327 115.657C281.688 126.93 265.983 132.758 249.911 129.518C239.862 127.491 231.319 122.25 225.222 115.154C215.858 121.858 203.615 124.8 191.152 122.287C185.036 121.053 179.478 118.629 174.689 115.321C166.49 131.704 147.474 141.184 127.919 137.241C106.428 132.907 91.8209 113.879 93.3193 93.424C90.5408 92.7908 87.9479 91.777 85.5878 90.4544C85.805 93.8546 85.5852 97.3293 84.8825 100.814C80.3942 123.073 57.93 137.321 34.7075 132.639C11.4849 127.956 -3.7022 106.115 0.786103 83.8568C5.27452 61.5983 27.7386 47.3498 50.9611 52.0325C59.0573 53.6651 66.1748 57.3856 71.8243 62.4797C71.8635 62.2552 71.9069 62.0308 71.9522 61.8062C74.8758 47.3074 89.5084 38.026 104.635 41.0761C113.995 42.9634 121.349 49.1306 124.905 56.9924C131 55.5052 137.556 55.3006 144.173 56.6348C150.289 57.8681 155.848 60.2921 160.636 63.5998C168.836 47.218 187.851 37.7386 207.405 41.6814C217.454 43.7078 225.997 48.9484 232.094 56.044C237.911 51.8798 244.838 49.1667 252.239 48.312C252.28 48.0977 252.322 47.8833 252.365 47.6689C258.871 15.4041 290.743 -5.38857 323.553 1.22725Z"
        fill="#F3FDFF"
        fillOpacity="0.6"
      />
    </svg>
  )
}

function StarsSVG(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="196"
      height="125"
      viewBox="0 0 196 125"
      fill="none"
      style={{ position: 'absolute', left: 22, top: 9, display: 'block' }}
    >
      {/* Large 4-point star */}
      <path
        d="M109.263 10L110.693 15.3118C110.867 15.96 110.955 16.2841 111.127 16.5491C111.279 16.7835 111.479 16.9834 111.714 17.1358C111.979 17.308 112.303 17.3953 112.951 17.5698L118.263 19L112.951 20.4302C112.303 20.6047 111.979 20.692 111.714 20.8642C111.479 21.0166 111.279 21.2165 111.127 21.451C110.955 21.7159 110.867 22.04 110.693 22.6882L109.263 28L107.832 22.6882C107.658 22.04 107.571 21.7159 107.398 21.451C107.246 21.2165 107.046 21.0166 106.812 20.8642C106.547 20.692 106.223 20.6047 105.575 20.4302L100.263 19L105.575 17.5698C106.223 17.3953 106.547 17.308 106.812 17.1358C107.046 16.9834 107.246 16.7835 107.398 16.5491C107.571 16.2841 107.658 15.96 107.832 15.3118L109.263 10Z"
        fill="white"
      />
      {/* Small sparkle bottom-left */}
      <path
        d="M63.1096 96.3954L63.8963 98.0463C63.9923 98.2477 64.0403 98.3484 64.1125 98.4247C64.1764 98.4922 64.2538 98.5456 64.3396 98.5813C64.4365 98.6217 64.5478 98.6308 64.7702 98.6489L66.5928 98.7975L64.942 99.5841C64.7405 99.6801 64.6398 99.7281 64.5635 99.8003C64.496 99.8643 64.4427 99.9416 64.4069 100.027C64.3665 100.124 64.3575 100.236 64.3393 100.458L64.1908 102.281L63.4041 100.63C63.3081 100.428 63.2601 100.328 63.1879 100.251C63.124 100.184 63.0466 100.131 62.9608 100.095C62.8638 100.054 62.7526 100.045 62.5302 100.027L60.7076 99.8786L62.3584 99.092C62.5599 98.996 62.6606 98.948 62.7369 98.8758C62.8044 98.8118 62.8577 98.7345 62.8935 98.6487C62.9338 98.5517 62.9429 98.4405 62.961 98.2181L63.1096 96.3954Z"
        fill="white"
      />
      {/* Tiny sparkle mid-left */}
      <path
        d="M69.5058 56.9554L69.9969 57.9859C70.0568 58.1116 70.0868 58.1745 70.1318 58.2221C70.1717 58.2643 70.22 58.2976 70.2736 58.3199C70.3341 58.3451 70.4035 58.3508 70.5424 58.3621L71.6801 58.4548L70.6496 58.9459C70.5239 59.0058 70.461 59.0358 70.4134 59.0808C70.3713 59.1207 70.3379 59.169 70.3156 59.2226C70.2904 59.2831 70.2848 59.3525 70.2734 59.4914L70.1807 60.6291L69.6897 59.5986C69.6297 59.4729 69.5998 59.41 69.5547 59.3624C69.5148 59.3202 69.4665 59.2869 69.4129 59.2646C69.3524 59.2394 69.283 59.2338 69.1441 59.2224L68.0064 59.1297L69.0369 58.6386C69.1626 58.5787 69.2255 58.5488 69.2731 58.5037C69.3153 58.4638 69.3486 58.4155 69.3709 58.3619C69.3961 58.3014 69.4018 58.232 69.4131 58.0931L69.5058 56.9554Z"
        fill="white"
      />
      {/* Medium 4-point star right */}
      <path
        d="M188.763 67L189.796 70.8363C189.922 71.3044 189.985 71.5385 190.109 71.7299C190.219 71.8992 190.364 72.0435 190.533 72.1536C190.724 72.278 190.958 72.3411 191.426 72.4671L195.263 73.5L191.426 74.5329C190.958 74.6589 190.724 74.722 190.533 74.8464C190.364 74.9564 190.219 75.1008 190.109 75.2702C189.985 75.4615 189.922 75.6956 189.796 76.1637L188.763 80L187.73 76.1637C187.604 75.6956 187.541 75.4615 187.416 75.2702C187.306 75.1008 187.162 74.9564 186.993 74.8464C186.801 74.722 186.567 74.6589 186.099 74.5329L182.263 73.5L186.099 72.4671C186.567 72.3411 186.801 72.278 186.993 72.1536C187.162 72.0435 187.306 71.8992 187.416 71.7299C187.541 71.5385 187.604 71.3044 187.73 70.8363L188.763 67Z"
        fill="white"
      />
      {/* Medium 4-point star top-right */}
      <path
        d="M181.763 0L182.796 3.83631C182.922 4.30444 182.985 4.53851 183.11 4.72987C183.22 4.89919 183.364 5.04354 183.533 5.15363C183.725 5.278 183.959 5.34105 184.427 5.46708L188.263 6.5L184.427 7.53292C183.959 7.65895 183.725 7.722 183.533 7.84637C183.364 7.95643 183.22 8.10081 183.11 8.27017C182.985 8.46148 182.922 8.69556 182.796 9.1637L181.763 13L180.73 9.1637C180.604 8.69556 180.541 8.46148 180.417 8.27017C180.307 8.10081 180.162 7.95643 179.993 7.84637C179.802 7.722 179.568 7.65895 179.099 7.53292L175.263 6.5L179.099 5.46708C179.568 5.34105 179.802 5.278 179.993 5.15363C180.162 5.04354 180.307 4.89919 180.417 4.72987C180.541 4.53851 180.604 4.30444 180.73 3.83631L181.763 0Z"
        fill="white"
      />
      {/* Diagonal sparkle far-left */}
      <path
        d="M6.85554 61.331L6.49826 63.7496C6.45466 64.0448 6.43287 64.1924 6.45617 64.3309C6.4768 64.4534 6.52291 64.5703 6.59152 64.6739C6.66903 64.791 6.7857 64.884 7.01906 65.0699L8.93133 66.5932L6.5127 66.236C6.21756 66.1924 6.06998 66.1706 5.9315 66.1939C5.80893 66.2145 5.69205 66.2606 5.58841 66.3292C5.47131 66.4067 5.37835 66.5234 5.19246 66.7568L3.6691 68.669L4.02637 66.2504C4.06998 65.9553 4.09176 65.8077 4.06846 65.6692C4.04782 65.5466 4.00173 65.4298 3.93314 65.3261C3.8556 65.209 3.73894 65.1161 3.50558 64.9302L1.59331 63.4068L4.01194 63.7641C4.30708 63.8077 4.45465 63.8295 4.59315 63.8062C4.71571 63.7855 4.83257 63.7394 4.93622 63.6708C5.05333 63.5933 5.14629 63.4766 5.33217 63.2433L6.85554 61.331Z"
        fill="white"
      />
      {/* Diagonal sparkle bottom-center */}
      <path
        d="M113.118 115.593L112.761 118.012C112.717 118.307 112.696 118.455 112.719 118.593C112.739 118.716 112.786 118.832 112.854 118.936C112.932 119.053 113.048 119.146 113.282 119.332L115.194 120.855L112.775 120.498C112.48 120.455 112.333 120.433 112.194 120.456C112.072 120.477 111.955 120.523 111.851 120.591C111.734 120.669 111.641 120.786 111.455 121.019L109.932 122.931L110.289 120.513C110.333 120.217 110.354 120.07 110.331 119.931C110.311 119.809 110.264 119.692 110.196 119.588C110.118 119.471 110.002 119.378 109.768 119.192L107.856 117.669L110.275 118.026C110.57 118.07 110.717 118.092 110.856 118.068C110.978 118.048 111.095 118.002 111.199 117.933C111.316 117.856 111.409 117.739 111.595 117.505L113.118 115.593Z"
        fill="white"
      />
      {/* 4-point diamond top-left */}
      <path
        d="M24.2252 16.0493L26.6546 17.9034C26.9511 18.1296 27.0993 18.2427 27.2649 18.3011C27.4114 18.3526 27.5672 18.3729 27.7221 18.3606C27.897 18.3466 28.0693 18.2753 28.4138 18.1325L31.2371 16.9624L29.383 19.3918C29.1567 19.6883 29.0436 19.8365 28.9853 20.0021C28.9337 20.1487 28.9134 20.3044 28.9258 20.4593C28.9397 20.6342 29.0111 20.8065 29.1539 21.151L30.3239 23.9743L27.8945 22.1202C27.598 21.8939 27.4498 21.7808 27.2842 21.7225C27.1377 21.6709 26.9819 21.6506 26.8271 21.663C26.6521 21.6769 26.4798 21.7483 26.1353 21.8911L23.3121 23.0611L25.1661 20.6317C25.3924 20.3353 25.5055 20.187 25.5638 20.0214C25.6154 19.8749 25.6357 19.7192 25.6234 19.5643C25.6094 19.3893 25.538 19.217 25.3952 18.8725L24.2252 16.0493Z"
        fill="white"
      />
    </svg>
  )
}
