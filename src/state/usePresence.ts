import { useEffect, useState } from 'react'

/** Matches --t-fast, the exit duration of panels, menus and banners. */
export const EXIT_MS = 150

/**
 * Keeps a closed panel mounted while it plays its exit. `closing` is true for those last EXIT_MS, so the panel can
 * take its `is-closing` styles and stop answering clicks; opening it again meanwhile cancels the exit.
 */
export function usePresence(open: boolean): { mounted: boolean; closing: boolean } {
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)

  useEffect(() => {
    if (open || !mounted) return
    const t = window.setTimeout(() => setMounted(false), EXIT_MS)
    return () => window.clearTimeout(t)
  }, [open, mounted])

  return { mounted, closing: mounted && !open }
}
