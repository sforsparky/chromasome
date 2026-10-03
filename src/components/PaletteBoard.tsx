import { Fragment, useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import type { PaletteReport } from '../lib/color/checks'
import { usePalette } from '../state/PaletteProvider'
import { useStacked } from '../state/useStacked'
import { ColorColumn, type DragHandlers } from './ColorColumn'
import { ColumnInserter } from './ColumnInserter'

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
          />
        </Fragment>
      ))}
    </main>
  )
}
