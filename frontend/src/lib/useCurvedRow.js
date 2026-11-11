// Hooks for the curved shelf: covers turn away from the viewer the further they are from the centre.
import { useEffect, useState } from 'react'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

// True when the person has asked their device for less motion. Updates if they change the setting.
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia(REDUCED_MOTION).matches)
  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION)
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

// How far covers turn, sink back, shrink and fade, at most.
const MAX_DISTANCE = 1.6 // measured in "cover widths" from the centre
const ANGLE = 38 // degrees of turn per cover width
const DEPTH = 90 // pixels pushed back per cover width
const SHRINK = 0.12
const FADE = 0.28

// Every time the row scrolls (or changes size), place each cover on the curve.
// `count` is the number of covers, so the effect runs again when covers are added or removed.
export function useCurvedRow(rowRef, enabled, count) {
  useEffect(() => {
    const row = rowRef.current
    if (!row || !enabled) return undefined

    let frame = 0
    const curve = () => {
      const middle = row.scrollLeft + row.clientWidth / 2
      for (const book of row.children) {
        const center = book.offsetLeft + book.offsetWidth / 2
        const raw = (center - middle) / (book.offsetWidth * 1.25)
        const distance = Math.max(-MAX_DISTANCE, Math.min(MAX_DISTANCE, raw))
        const away = Math.abs(distance)
        book.style.transform =
          `translateZ(${-away * DEPTH}px) rotateY(${-distance * ANGLE}deg) scale(${1 - Math.min(away, 1.4) * SHRINK})`
        book.style.opacity = String(1 - away * FADE)
        book.style.zIndex = String(100 - Math.round(away * 10))
      }
    }
    // Scroll events fire many times per frame; requestAnimationFrame does the work once per frame.
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(curve)
    }

    curve()
    row.addEventListener('scroll', schedule, { passive: true })
    const resize = new ResizeObserver(schedule)
    resize.observe(row)

    return () => {
      cancelAnimationFrame(frame)
      row.removeEventListener('scroll', schedule)
      resize.disconnect()
      for (const book of row.children) {
        book.style.transform = ''
        book.style.opacity = ''
        book.style.zIndex = ''
      }
    }
  }, [rowRef, enabled, count])
}
