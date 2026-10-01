import { useEffect, useState } from 'react'

export const STACKED_QUERY = '(max-width: 700px)'

/** True when the board lays columns out vertically (phone widths). Mirrors the CSS breakpoint. */
export function useStacked(): boolean {
  const [stacked, setStacked] = useState(() => typeof window !== 'undefined' && window.matchMedia(STACKED_QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia(STACKED_QUERY)
    const onChange = () => setStacked(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return stacked
}
