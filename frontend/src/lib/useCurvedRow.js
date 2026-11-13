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

// How long the row must be still (and untouched) before it settles on the nearest cover.
// Phones keep firing scroll events while a swipe glides, so this only counts once it has stopped.
const SETTLE_DELAY = 140 // milliseconds

// Every time the row scrolls, place each cover on the curve.
// `count` is the number of covers, so the effect runs again when covers are added or removed.
//
// Performance: the covers' positions don't change while scrolling, only the scroll amount does.
// So positions are measured once (and again when the shelf changes size), and each frame only
// reads the scroll position, then writes transforms. Reading a position right after writing a
// style would force the browser to recalculate styles immediately, for every cover, every frame.
export function useCurvedRow(rowRef, enabled, count) {
  useEffect(() => {
    const row = rowRef.current
    if (!row || !enabled) return undefined

    let centers = [] // each cover's centre, measured from the row's left edge
    let width = 0 // one cover's width
    const zIndexes = [] // last z-index written for each cover, to avoid rewriting the same value

    const measure = () => {
      const books = Array.from(row.children)
      centers = books.map((book) => book.offsetLeft + book.offsetWidth / 2)
      width = books[0]?.offsetWidth || 1
    }

    let frame = 0
    const curve = () => {
      const middle = row.scrollLeft + row.clientWidth / 2 // the only reads in a frame, before any writes
      const books = row.children
      for (let i = 0; i < books.length; i += 1) {
        const raw = (centers[i] - middle) / (width * 1.25)
        const distance = Math.max(-MAX_DISTANCE, Math.min(MAX_DISTANCE, raw))
        const away = Math.abs(distance)
        const style = books[i].style
        style.transform =
          `translateZ(${-away * DEPTH}px) rotateY(${-distance * ANGLE}deg) scale(${1 - Math.min(away, 1.4) * SHRINK})`
        style.opacity = String(1 - away * FADE)
        const z = 100 - Math.round(away * 10)
        if (zIndexes[i] !== z) {
          style.zIndex = String(z)
          zIndexes[i] = z
        }
      }
    }
    // Scroll events fire many times per frame; requestAnimationFrame does the work once per frame.
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(curve)
    }

    // Settling: CSS snapping is set to "proximity" (so vertical swipes don't catch on the shelf),
    // which means a fast swipe on a phone can stop between two covers. Once the row has stopped
    // and no finger is on the screen, glide to the nearest cover. A small sideways nudge from a
    // vertical swipe just settles back on the same cover.
    let touching = false
    let settleTimer = 0
    const settle = () => {
      if (touching || centers.length === 0) return
      const middle = row.scrollLeft + row.clientWidth / 2
      let nearest = centers[0]
      for (const center of centers) {
        if (Math.abs(center - middle) < Math.abs(nearest - middle)) nearest = center
      }
      const left = nearest - row.clientWidth / 2
      if (Math.abs(left - row.scrollLeft) > 2) row.scrollTo({ left, behavior: 'smooth' })
    }
    const scheduleSettle = () => {
      clearTimeout(settleTimer)
      settleTimer = setTimeout(settle, SETTLE_DELAY)
    }
    const onScroll = () => {
      schedule()
      scheduleSettle()
    }
    const onTouchStart = () => {
      touching = true
      clearTimeout(settleTimer)
    }
    const onTouchEnd = () => {
      touching = false
      scheduleSettle()
    }

    const remeasure = () => {
      measure()
      schedule()
    }

    measure()
    curve()
    row.addEventListener('scroll', onScroll, { passive: true })
    row.addEventListener('touchstart', onTouchStart, { passive: true })
    row.addEventListener('touchend', onTouchEnd, { passive: true })
    row.addEventListener('touchcancel', onTouchEnd, { passive: true })
    const resize = new ResizeObserver(remeasure)
    resize.observe(row)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(settleTimer)
      row.removeEventListener('scroll', onScroll)
      row.removeEventListener('touchstart', onTouchStart)
      row.removeEventListener('touchend', onTouchEnd)
      row.removeEventListener('touchcancel', onTouchEnd)
      resize.disconnect()
      for (const book of row.children) {
        book.style.transform = ''
        book.style.opacity = ''
        book.style.zIndex = ''
      }
    }
  }, [rowRef, enabled, count])
}
