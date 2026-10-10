import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent, type RefObject } from 'react'
import type { PaletteReport } from '../lib/color/checks'
import { usePalette } from '../state/PaletteProvider'
import { useStacked } from '../state/useStacked'
import { ColorColumn, type DragHandlers } from './ColorColumn'
import { ColumnInserter } from './ColumnInserter'

const GLIDE_MS = 220
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)' // --ease-out
const FLAT = { scale: '1', borderRadius: '0px', boxShadow: '0 0 0 rgb(0 0 0 / 0)' }
const LIFTED = { scale: '0.96', borderRadius: '12px', boxShadow: '0 12px 32px rgb(0 0 0 / 0.45)' }
const LIFT: Keyframe[] = [FLAT, { ...LIFTED, offset: 0.2 }, { ...LIFTED, offset: 0.45 }, FLAT]

/** Same swatches, different order: a move, or undo/redo of one. */
function isReorder(before: string[], after: string[]): boolean {
  if (before.length !== after.length) return false
  const known = new Set(before)
  return after.every((id) => known.has(id)) && after.some((id, i) => id !== before[i])
}

/**
 * Reorders (arrows, drag and drop, undo/redo of a move) glide each column from its old place to its new one.
 * A column's size travels with its swatch, so its old offset is the sum of the sizes that came before it in the
 * old order. A column still gliding from a previous move starts from where it is on screen.
 */
function useReorderGlide(boardRef: RefObject<HTMLElement | null>, ids: string[], stacked: boolean) {
  const previous = useRef<string[] | null>(null)

  useLayoutEffect(() => {
    const before = previous.current
    previous.current = ids
    if (!before || !isReorder(before, ids)) return
    const cols = boardRef.current?.querySelectorAll<HTMLElement>('.column')
    if (!cols || cols.length !== ids.length || typeof cols[0].getAnimations !== 'function') return

    // Where each column is on screen, read before anything below cancels a glide still in flight.
    const inFlight = Array.from(cols, (col) => {
      const transform = getComputedStyle(col).transform
      if (transform === 'none') return 0
      const matrix = new DOMMatrixReadOnly(transform)
      return stacked ? matrix.m42 : matrix.m41
    })

    for (const col of cols) {
      for (const a of col.getAnimations()) {
        if (a.id === 'glide') a.cancel()
        // React moves a column by re-inserting its node, which replays the @starting-style entry fade. It isn't entering.
        if (a instanceof CSSTransition && (a.transitionProperty === 'opacity' || a.transitionProperty === 'transform')) a.finish()
      }
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const size = new Map(ids.map((id, i) => [id, stacked ? cols[i].offsetHeight : cols[i].offsetWidth]))
    const offsets = (order: string[]) => {
      const at = new Map<string, number>()
      let sum = 0
      for (const id of order) {
        at.set(id, sum)
        sum += size.get(id)!
      }
      return at
    }
    const from = offsets(before)
    const to = offsets(ids)

    ids.forEach((id, i) => {
      const col = cols[i]
      const delta = from.get(id)! + inFlight[i] - to.get(id)!
      if (Math.abs(delta) < 1) return
      const shift = stacked ? `translateY(${delta}px)` : `translateX(${delta}px)`
      col.animate([{ transform: shift }, { transform: 'none' }], { duration: GLIDE_MS, easing: EASE_OUT, id: 'glide' })
      // Edge-to-edge columns can't swap places without uncovering the board, so the movers lift like cards
      // while they pass; the board between them then reads as the table they slide over.
      col.animate(LIFT, { duration: GLIDE_MS, id: 'glide' })
    })
  }, [boardRef, ids, stacked])
}

type Props = {
  adjustingId: string | null
  onAdjust: (id: string | null) => void
  report: PaletteReport
  /** Show every column as its greyscale value (the squint test). */
  squint: boolean
  /** Size columns by their 60/30/10 share instead of equally. */
  proportional: boolean
  showRoles: boolean
}

export function PaletteBoard({ adjustingId, onAdjust, report, squint, proportional, showRoles }: Props) {
  const { palette, dispatch } = usePalette()
  const stacked = useStacked()
  const boardRef = useRef<HTMLElement>(null)
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  // First-load reveal: the intro cascade runs once, then columns enter plainly.
  const [intro, setIntro] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => setIntro(false), 1200)
    return () => window.clearTimeout(t)
  }, [])

  const ids = useMemo(() => palette.map((s) => s.id), [palette])
  useReorderGlide(boardRef, ids, stacked)

  // Columns added beside ones already on the board (derived during render, so the class is there at mount).
  // A whole new strand (Extract from photo, undoing it) has nothing to grow beside, so it only fades in.
  const [seenIds, setSeenIds] = useState(ids)
  const [entering, setEntering] = useState<ReadonlySet<string>>(() => new Set())
  if (seenIds !== ids) {
    const known = new Set(seenIds)
    const fresh = ids.filter((id) => !known.has(id))
    setSeenIds(ids)
    setEntering(new Set(fresh.length < ids.length ? fresh : []))
  }

  /** Which column sits under the pointer along the board's main axis (clamped to the ends). */
  const indexAtPoint = useCallback(
    (x: number, y: number): number | null => {
      const cols = boardRef.current?.querySelectorAll<HTMLElement>('.column')
      if (!cols || cols.length === 0) return null
      const pos = stacked ? y : x
      for (let i = 0; i < cols.length; i++) {
        const r = cols[i].getBoundingClientRect()
        const start = stacked ? r.top : r.left
        const end = stacked ? r.bottom : r.right
        if (pos >= start && pos < end) return i
      }
      const first = cols[0].getBoundingClientRect()
      return pos < (stacked ? first.top : first.left) ? 0 : cols.length - 1
    },
    [stacked],
  )

  const endDrag = useCallback(() => {
    setDragFrom(null)
    setDragOver(null)
  }, [])

  // Pointer Events cover mouse, pen and touch alike; HTML5 drag-and-drop does not fire on touch.
  const drag: DragHandlers = {
    onPointerDown: (index: number, e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* synthetic events have no active pointer; dragging still works without capture */
      }
      setDragFrom(index)
      setDragOver(index)
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (dragFrom === null) return
      const target = indexAtPoint(e.clientX, e.clientY)
      if (target !== null && target !== dragOver) setDragOver(target)
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      if (dragFrom === null) return
      const target = indexAtPoint(e.clientX, e.clientY) ?? dragOver
      if (target !== null && target !== dragFrom) dispatch({ type: 'MOVE', from: dragFrom, to: target })
      endDrag()
    },
    onPointerCancel: endDrag,
  }

  // Escape abandons an in-progress drag.
  useEffect(() => {
    if (dragFrom === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') endDrag()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dragFrom, endDrag])

  const cls = ['board', intro && 'board--intro', dragFrom !== null && 'board--dragging', proportional && 'board--proportional'].filter(Boolean).join(' ')

  return (
    <main className={cls} role="list" aria-label="Palette" ref={boardRef}>
      {palette.map((swatch, i) => (
        <Fragment key={swatch.id}>
          {i > 0 && <ColumnInserter index={i} />}
          <ColorColumn
            swatch={swatch}
            index={i}
            stacked={stacked}
            adjusting={adjustingId === swatch.id}
            onAdjust={onAdjust}
            drag={drag}
            dragging={dragFrom === i}
            dropTarget={dragOver === i && dragFrom !== null && dragFrom !== i}
            role={report.roles[i].role}
            share={proportional ? report.roles[i].weight * palette.length : undefined}
            squint={squint}
            showRole={showRoles}
            entering={entering.has(swatch.id)}
          />
        </Fragment>
      ))}
    </main>
  )
}
