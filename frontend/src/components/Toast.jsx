// A small message at the bottom of the screen that goes away by itself, with an optional action
// (e.g. "Undo"). One toast shows at a time; a new one replaces the old.
//
//   const { showToast } = useToast()
//   showToast('Added Frieren', { label: 'Undo', onClick: () => ... })
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

const SHOW_FOR_MS = 6000 // long enough to notice a mistake and reach for Undo

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(0)

  const dismiss = useCallback(() => {
    clearTimeout(timer.current)
    setToast(null)
  }, [])

  const showToast = useCallback((message, action) => {
    clearTimeout(timer.current)
    setToast({ message, action, id: Date.now() })
    timer.current = setTimeout(() => setToast(null), SHOW_FOR_MS)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  const value = useMemo(() => ({ showToast, dismiss }), [showToast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* The live region stays in the page, so screen readers announce each message as it appears. */}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.id}>
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  dismiss()
                  toast.action.onClick()
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside <ToastProvider>')
  return value
}
