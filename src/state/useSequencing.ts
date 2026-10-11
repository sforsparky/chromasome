import { useEffect, useState } from 'react'
import { candidateColors } from '../lib/color/generate'

/**
 * Sequencing timeline (ms, per column, after its stagger delay):
 *   pending  until the column's turn: still shows the previous color and hex
 *   scan     0–350   scan line sweeps, background flickers through candidates, hex glyphs scramble
 *   lock   350–550   glyphs resolve left to right, background snaps to the final color
 *   settle 550–600   band marker fades, color name fades in
 * Locked columns skip the sequence and show a brief "skipped" pulse instead.
 * A column that has never shown a color (first load, Extract DNA, Add) boots from dark.
 */
export const SEQ_SCAN_MS = 350
export const SEQ_LOCK_MS = 200
export const SEQ_SETTLE_MS = 50
export const SEQ_TOTAL_MS = SEQ_SCAN_MS + SEQ_LOCK_MS + SEQ_SETTLE_MS
export const SEQ_STAGGER_MS = 50
const FLICKER_MS = 90 // background candidate hold time during scan
const SCRAMBLE_MS = 40 // glyph re-roll interval during scan
const CANDIDATES = 4
export const BOOT_HEX = '#141416'
const BOOT_GLYPHS = '······'

export type SeqPhase = 'idle' | 'pending' | 'scan' | 'lock' | 'settle' | 'skipped'

export type Sequencing = {
  /** Background color to render right now. */
  displayHex: string
  /** Six hex glyphs to render (no '#'); scrambled while scanning. */
  glyphs: string
  /** How many leading glyphs are final (6 when idle). */
  resolved: number
  phase: SeqPhase
}

const HEX_GLYPHS = '0123456789ABCDEF'

const glyphsOf = (hex: string) => (hex === BOOT_HEX ? BOOT_GLYPHS : hex.slice(1).toUpperCase())

function randomGlyphs(): string {
  let s = ''
  for (let i = 0; i < 6; i++) s += HEX_GLYPHS[Math.floor(Math.random() * 16)]
  return s
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/**
 * Drive the sequencing animation for one column. The palette state is already
 * final when this runs; only the presentation lags behind for ~600 ms.
 */
export function useSequencing(hex: string, locked: boolean, index: number, generation: number): Sequencing {
  const [phase, setPhase] = useState<SeqPhase>('idle')
  const [displayHex, setDisplayHex] = useState(hex)
  const [glyphs, setGlyphs] = useState(glyphsOf(hex))
  const [resolved, setResolved] = useState(6)
  // What this column last showed while idle, so a new generation can hold it until its turn.
  const [lastShown, setLastShown] = useState(BOOT_HEX)
  const [seenGeneration, setSeenGeneration] = useState<number | null>(null)

  const atRest = phase === 'idle' || phase === 'skipped'

  // A new generation arrived in this render (first mount counts too). Decide the
  // column's fate synchronously so no frame of the final color leaks out early.
  if (seenGeneration !== generation) {
    setSeenGeneration(generation)
    if (locked) {
      setPhase('skipped')
    } else if (prefersReducedMotion()) {
      setPhase('idle')
    } else {
      setPhase('pending')
      setDisplayHex(lastShown)
      setGlyphs(glyphsOf(lastShown))
      setResolved(0)
    }
  } else if (atRest && lastShown !== hex) {
    setLastShown(hex)
  }

  // Runs once per generation, right after the render that chose the column's fate above.
  // `phase`, `hex` and `index` are read from that render's closure on purpose.
  useEffect(() => {
    if (phase === 'skipped') {
      const t = window.setTimeout(() => setPhase('idle'), SEQ_TOTAL_MS)
      return () => window.clearTimeout(t)
    }
    if (phase !== 'pending') return

    const target = hex
    const candidates = candidateColors(target, CANDIDATES)
    if (candidates.length === 0) candidates.push(target)
    const start = performance.now() + index * SEQ_STAGGER_MS
    let raf = 0
    let lastScramble = -Infinity
    let lastPhase: SeqPhase = 'pending'

    const frame = (now: number) => {
      const t = now - start
      let next: SeqPhase
      if (t < 0) {
        next = 'pending'
      } else if (t < SEQ_SCAN_MS) {
        next = 'scan'
        setDisplayHex(candidates[Math.floor(t / FLICKER_MS) % candidates.length])
        if (now - lastScramble >= SCRAMBLE_MS) {
          lastScramble = now
          setGlyphs(randomGlyphs())
        }
        setResolved(0)
      } else if (t < SEQ_SCAN_MS + SEQ_LOCK_MS) {
        next = 'lock'
        setDisplayHex(target)
        const n = Math.min(6, Math.floor(((t - SEQ_SCAN_MS) / SEQ_LOCK_MS) * 7))
        setResolved(n)
        if (now - lastScramble >= SCRAMBLE_MS) {
          lastScramble = now
          setGlyphs(glyphsOf(target).slice(0, n) + randomGlyphs().slice(n))
        }
      } else if (t < SEQ_TOTAL_MS) {
        next = 'settle'
        setDisplayHex(target)
        setGlyphs(glyphsOf(target))
        setResolved(6)
      } else {
        setPhase('idle')
        return
      }
      if (next !== lastPhase) {
        lastPhase = next
        setPhase(next)
      }
      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generation])

  if (atRest) return { displayHex: hex, glyphs: glyphsOf(hex), resolved: 6, phase }
  return { displayHex, glyphs, resolved, phase }
}
