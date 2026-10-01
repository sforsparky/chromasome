import { Fragment, useCallback, useEffect, useState, type DragEvent } from 'react'
import { usePalette } from '../state/PaletteProvider'
import { ColorColumn } from './ColorColumn'
import { ColumnInserter } from './ColumnInserter'

type Props = {
  adjustingId: string | null
  onAdjust: (id: string | null) => void
}

export function PaletteBoard({ adjustingId, onAdjust }: Props) {
  const { palette, dispatch } = usePalette()
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  // First-load reveal: the intro cascade runs once, then columns enter plainly.
  const [intro, setIntro] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => setIntro(false), 1200)
    return () => window.clearTimeout(t)
  }, [])

  const onDragStart = useCallback((index: number) => setDragFrom(index), [])

  const onDragOver = useCallback(
    (e: DragEvent, index: number) => {
      if (dragFrom === null) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (dragOver !== index) setDragOver(index)
    },
    [dragFrom, dragOver],
  )

  const onDrop = useCallback(
    (index: number) => {
      if (dragFrom !== null && dragFrom !== index) dispatch({ type: 'MOVE', from: dragFrom, to: index })
      setDragFrom(null)
      setDragOver(null)
    },
    [dragFrom, dispatch],
  )

  const onDragEnd = () => {
    setDragFrom(null)
    setDragOver(null)
  }

  return (
    <main className={`board${intro ? ' board--intro' : ''}`} role="list" aria-label="Palette" onDragEnd={onDragEnd}>
      {palette.map((swatch, i) => (
        <Fragment key={swatch.id}>
          {i > 0 && <ColumnInserter index={i} />}
          <ColorColumn
            swatch={swatch}
            index={i}
            adjusting={adjustingId === swatch.id}
            onAdjust={onAdjust}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            dragging={dragFrom === i}
            dropTarget={dragOver === i && dragFrom !== i}
          />
        </Fragment>
      ))}
    </main>
  )
}
