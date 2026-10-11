import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { copy } from '../copy'
import { textColorFor } from '../lib/color/contrast'
import { nearestName } from '../lib/color/names'
import { greyOf } from '../lib/color/oklch'
import type { Role } from '../lib/color/roles'
import { copyText } from '../lib/export/clipboard'
import { usePalette } from '../state/PaletteProvider'
import { usePresence } from '../state/usePresence'
import { MIN_COLORS, type Swatch } from '../state/types'
import { AdjustPanel } from './AdjustPanel'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, CloseIcon, GripIcon, LockIcon, SlidersIcon, UnlockIcon } from './Icons'

export type DragHandlers = {
  onPointerDown: (index: number, e: PointerEvent<HTMLElement>) => void
  onPointerMove: (e: PointerEvent<HTMLElement>) => void
  onPointerUp: (e: PointerEvent<HTMLElement>) => void
  onPointerCancel: () => void
}

type Props = {
  swatch: Swatch
  index: number
  /** Columns are stacked vertically (phone layout), so "left/right" reads as "up/down". */
  stacked: boolean
  adjusting: boolean
  onAdjust: (id: string | null) => void
  drag: DragHandlers
  dragging: boolean
  dropTarget: boolean
  role: Role
  /** flex-grow when the board is sized by role; undefined keeps equal columns. */
  share?: number
  squint: boolean
  showRole: boolean
  /** Added beside columns that were already there (Add, or undoing a Remove), so it grows in from nothing. */
  entering: boolean
}

const SWAP_MS = 200 // matches .column__hex-label transition
const COPIED_HOLD_MS = 900

/**
 * Swap the hex readout to "Copied" and back through a blurred crossfade.
 * Returns the label to show and whether a swap is in flight.
 */
function useCopiedLabel(): { copied: boolean; swapping: boolean; flash: () => void } {
  const [copied, setCopied] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const timers = useRef<number[]>([])

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clear, [])

  const swapTo = useCallback((value: boolean, after: number) => {
    const t1 = window.setTimeout(() => setSwapping(true), after)
    const t2 = window.setTimeout(() => setCopied(value), after + SWAP_MS / 2)
    const t3 = window.setTimeout(() => setSwapping(false), after + SWAP_MS)
    timers.current.push(t1, t2, t3)
  }, [])

  const flash = useCallback(() => {
    clear()
    swapTo(true, 0)
    swapTo(false, SWAP_MS + COPIED_HOLD_MS)
  }, [swapTo])

  return { copied, swapping, flash }
}

const LEAVE_MS = 200 // --t-dialog
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)' // --ease-out

/**
 * Remove: the column narrows to nothing and fades while its neighbors widen into the space, then it is removed.
 * With reduced motion it only fades. If another column's removal brought the strand down to its minimum
 * meanwhile, the reducer would ignore this one, so it stays and settles back.
 */
function useLeave(id: string, count: number): { leaving: boolean; remove: (column: HTMLElement | null) => void } {
  const { dispatch } = usePalette()
  const [leaving, setLeaving] = useState(false)
  const latestCount = useRef(count)
  useEffect(() => {
    latestCount.current = count
  })

  const remove = (column: HTMLElement | null) => {
    if (leaving) return
    if (!column || typeof column.animate !== 'function') {
      dispatch({ type: 'REMOVE', id })
      return
    }
    setLeaving(true)
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const grow = getComputedStyle(column).flexGrow
    const frames = still
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [
          { opacity: 1, flexGrow: grow },
          { opacity: 0, flexGrow: '0' },
        ]
    const exit = column.animate(frames, { duration: LEAVE_MS, easing: EASE_OUT, fill: 'forwards' })
    exit.finished.then(
      () => {
        if (latestCount.current > MIN_COLORS) {
          dispatch({ type: 'REMOVE', id })
          return
        }
        exit.cancel()
        setLeaving(false)
      },
      () => setLeaving(false),
    )
  }

  return { leaving, remove }
}

export function ColorColumn({ swatch, index, stacked, adjusting, onAdjust, drag, dragging, dropTarget, role, share, squint, showRole, entering }: Props) {
  const { palette, dispatch } = usePalette()
  const shown = squint ? greyOf(swatch.hex) : swatch.hex
  const text = textColorFor(shown)
  const roleLabel = copy.roleLabels[role]
  const name = nearestName(swatch.hex)
  const n = palette.length
  const { copied, swapping, flash } = useCopiedLabel()
  const rootRef = useRef<HTMLDivElement>(null)

  const copyHex = async () => {
    await copyText(swatch.hex)
    flash()
  }

  const closeAdjust = useCallback(() => onAdjust(null), [onAdjust])
  const adjustPanel = usePresence(adjusting)
  const { leaving, remove } = useLeave(swatch.id, n)

  const cls = [
    'column',
    swatch.locked && 'column--locked',
    adjusting && 'column--adjusting',
    entering && 'column--entering',
    leaving && 'column--leaving',
    dragging && 'column--dragging',
    dropTarget && 'column--drop-target',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={rootRef}
      className={cls}
      style={{ backgroundColor: shown, color: text, flexGrow: share, '--i': index } as CSSProperties}
      role="listitem"
      aria-label={`${swatch.hex} ${name}${showRole ? `, ${roleLabel}` : ''}${swatch.locked ? ', locked' : ''}`}
    >
      {/* Always mounted so a Mutate only swaps its text; visibility follows showRole. */}
      <span className={`column__role${showRole ? ' is-on' : ''}`} aria-hidden="true">
        {roleLabel}
      </span>
      <div className="column__controls">
        <button
          type="button"
          className="column__btn column__btn--drag"
          onPointerDown={(e) => drag.onPointerDown(index, e)}
          onPointerMove={drag.onPointerMove}
          onPointerUp={drag.onPointerUp}
          onPointerCancel={drag.onPointerCancel}
          aria-label={copy.drag}
          title={copy.drag}
        >
          <GripIcon />
        </button>
        {n > MIN_COLORS && (
          <button type="button" className="column__btn" onClick={() => remove(rootRef.current)} aria-label={copy.remove} title={copy.remove}>
            <CloseIcon />
          </button>
        )}
        <button type="button" className="column__btn" onClick={() => onAdjust(adjusting ? null : swatch.id)} aria-label={copy.adjust} title={copy.adjust} aria-expanded={adjusting}>
          <SlidersIcon />
        </button>
        <div className="column__move">
          <button
            type="button"
            className="column__btn"
            onClick={() => dispatch({ type: 'MOVE', from: index, to: index - 1 })}
            disabled={index === 0}
            aria-label={stacked ? copy.moveUp : copy.moveLeft}
            title={stacked ? copy.moveUp : copy.moveLeft}
          >
            {stacked ? <ChevronUpIcon /> : <ChevronLeftIcon />}
          </button>
          <button
            type="button"
            className="column__btn"
            onClick={() => dispatch({ type: 'MOVE', from: index, to: index + 1 })}
            disabled={index === n - 1}
            aria-label={stacked ? copy.moveDown : copy.moveRight}
            title={stacked ? copy.moveDown : copy.moveRight}
          >
            {stacked ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </button>
        </div>
        <button
          type="button"
          className={`column__btn column__btn--lock${swatch.locked ? ' is-on' : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_LOCK', id: swatch.id })}
          aria-pressed={swatch.locked}
          aria-label={swatch.locked ? copy.unlock : copy.lock}
          title={swatch.locked ? copy.unlock : copy.lock}
        >
          {swatch.locked ? <LockIcon key="on" /> : <UnlockIcon key="off" />}
        </button>
      </div>

      {adjustPanel.mounted && <AdjustPanel swatch={swatch} onClose={closeAdjust} closing={adjustPanel.closing} />}

      <div className="column__info">
        <button type="button" className="column__hex" onClick={copyHex} title="Copy hex" aria-label={`Copy ${swatch.hex}`}>
          <span className={`column__hex-label${swapping ? ' column__hex-label--swapping' : ''}`} aria-live="polite">
            {copied
              ? copy.toastCopied
              : swatch.hex
                  .slice(1)
                  .toUpperCase()
                  .split('')
                  .map((ch, g) => (
                    <span key={g} className="glyph" style={{ '--g': g } as CSSProperties}>
                      {ch}
                    </span>
                  ))}
          </span>
        </button>
        <span className="column__name">{name}</span>
      </div>
    </div>
  )
}
