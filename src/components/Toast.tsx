import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

type ToastContextValue = { show: (message: string) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

const SHOW_MS = 1500
const EXIT_MS = 150 // matches the .toast exit transition (--t-fast)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  // The text stays until the pill has faded out, so it never collapses to an empty pill on the way down.
  // Clearing it afterwards lets the same message be announced again next time.
  const show = useCallback((msg: string) => {
    setMessage(msg)
    setVisible(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setVisible(false)
      timer.current = window.setTimeout(() => setMessage(null), EXIT_MS)
    }, SHOW_MS)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={`toast${visible ? ' toast--visible' : ''}`} role="status" aria-live="polite">
        {message}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
