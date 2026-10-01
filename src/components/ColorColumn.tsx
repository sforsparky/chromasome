import { useCallback, type DragEvent } from 'react'
import { copy } from '../copy'
import { textColorFor } from '../lib/color/contrast'
import { nearestName } from '../lib/color/names'
import { copyText } from '../lib/export/clipboard'
import { usePalette } from '../state/PaletteProvider'
import { MIN_COLORS, type Swatch } from '../state/types'
import { useSequencing } from '../state/useSequencing'
import { AdjustPanel } from './AdjustPanel'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, GripIcon, LockIcon, SlidersIcon, UnlockIcon } from './Icons'
import { useToast } from './Toast'

type Props = {
  swatch: Swatch
  index: number
  adjusting: boolean
  onAdjust: (id: string | null) => void
  onDragStart: (index: number) => void
  onDragOver: (e: DragEvent, index: number) => void
  onDrop: (index: number) => void
  dragging: boolean
  dropTarget: boolean
}

export function ColorColumn({ swatch, index, adjusting, onAdjust, onDragStart, onDragOver, onDrop, dragging, dropTarget }: Props) {
  const { palette, dispatch, state } = usePalette()
  const toast = useToast()
  const seq = useSequencing(swatch.hex, swatch.locked, index, state.generation)
  const text = textColorFor(seq.displayHex)
  const name = nearestName(swatch.hex)
  const n = palette.length
  const sequencing = seq.phase === 'scan' || seq.phase === 'lock' || seq.phase === 'settle'

  const copyHex = async () => {
    await copyText(swatch.hex)
    toast.show(copy.toastCopiedHex(swatch.hex))
  }

  const closeAdjust = useCallback(() => onAdjust(null), [onAdjust])

  const cls = [
    'column',
    swatch.locked && 'column--locked',
    dragging && 'column--dragging',
    dropTarget && 'column--drop-target',
    sequencing && 'column--sequencing',
    `column--seq-${seq.phase}`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cls}
      data-phase={seq.phase}
      style={{ backgroundColor: seq.displayHex, color: text }}
      role="listitem"
      aria-label={`${swatch.hex} ${name}${swatch.locked ? ', locked' : ''}`}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(index)
      }}
    >
      <div className="column__controls">
        <button
          type="button"
          className="column__btn column__btn--drag"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/plain', String(index))
            onDragStart(index)
          }}
          aria-label={copy.drag}
          title={copy.drag}
        >
          <GripIcon />
        </button>
        {n > MIN_COLORS && (
          <button type="button" className="column__btn" onClick={() => dispatch({ type: 'REMOVE', id: swatch.id })} aria-label={copy.remove} title={copy.remove}>
            <CloseIcon />
          </button>
        )}
        <button type="button" className="column__btn" onClick={() => onAdjust(adjusting ? null : swatch.id)} aria-label={copy.adjust} title={copy.adjust} aria-expanded={adjusting}>
          <SlidersIcon />
        </button>
        <div className="column__move">
          <button type="button" className="column__btn" onClick={() => dispatch({ type: 'MOVE', from: index, to: index - 1 })} disabled={index === 0} aria-label={copy.moveLeft} title={copy.moveLeft}>
            <ChevronLeftIcon />
          </button>
          <button type="button" className="column__btn" onClick={() => dispatch({ type: 'MOVE', from: index, to: index + 1 })} disabled={index === n - 1} aria-label={copy.moveRight} title={copy.moveRight}>
            <ChevronRightIcon />
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
          {swatch.locked ? <LockIcon /> : <UnlockIcon />}
        </button>
      </div>

      {adjusting && <AdjustPanel swatch={swatch} onClose={closeAdjust} />}

      {(seq.phase === 'scan' || seq.phase === 'lock') && <div className="column__scan" aria-hidden="true" />}
      {seq.phase === 'settle' && <div className="column__band" aria-hidden="true" />}

      <div className="column__info">
        <button type="button" className="column__hex" onClick={copyHex} title="Copy hex" aria-label={`Copy ${swatch.hex}`}>
          {seq.glyphs.split('').map((ch, i) => (
            <span key={i} className={`glyph${i < seq.resolved ? ' glyph--set' : ''}${sequencing && i >= seq.resolved ? ' glyph--noise' : ''}`}>
              {ch}
            </span>
          ))}
        </button>
        <span className="column__name">{name}</span>
      </div>
    </div>
  )
}
