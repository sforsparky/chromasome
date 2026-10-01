import { useEffect, useRef, useState } from 'react'
import { copy } from '../copy'
import { hexToHsl, hslToHex, isValidHex, normalizeHex } from '../lib/color/convert'
import { usePalette } from '../state/PaletteProvider'
import type { Swatch } from '../state/types'
import { CloseIcon } from './Icons'

type Props = {
  swatch: Swatch
  onClose: () => void
}

/** Keys that change a range input's value; only these start an edit session. */
const SLIDER_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'])

export function AdjustPanel({ swatch, onClose }: Props) {
  const { dispatch } = usePalette()
  const [draft, setDraft] = useState(swatch.hex)
  const [syncedHex, setSyncedHex] = useState(swatch.hex)
  const editing = useRef(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const hsl = hexToHsl(swatch.hex)

  // Keep the text field in step with slider/picker changes (derived during render).
  if (syncedHex !== swatch.hex) {
    setSyncedHex(swatch.hex)
    setDraft(swatch.hex)
  }

  // Click outside closes.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [onClose])

  /** One history entry per slider drag / text edit session. */
  const beginEdit = () => {
    if (editing.current) return
    editing.current = true
    dispatch({ type: 'BEGIN_EDIT' })
  }
  const endEdit = () => {
    editing.current = false
  }

  const setHex = (hex: string) => dispatch({ type: 'SET_HEX', id: swatch.id, hex })

  const onSlider = (key: 'h' | 's' | 'l') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    const next = { ...hsl, [key]: key === 'h' ? v : v / 100 }
    setHex(hslToHex(next))
  }

  const commitDraft = () => {
    if (isValidHex(draft)) {
      const hex = normalizeHex(draft)
      if (hex !== swatch.hex) {
        beginEdit()
        setHex(hex)
        endEdit()
      }
    } else {
      setDraft(swatch.hex)
    }
  }

  return (
    <div className="adjust" ref={panelRef} role="dialog" aria-label={`${copy.adjust} ${swatch.hex}`}>
      <div className="adjust__row adjust__row--head">
        <input
          className="adjust__hex"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitDraft()
            if (e.key === 'Escape') onClose()
          }}
          aria-label="Hex value"
          spellCheck={false}
        />
        <input
          type="color"
          className="adjust__picker"
          value={swatch.hex}
          onPointerDown={beginEdit}
          onFocus={beginEdit}
          onChange={(e) => setHex(e.target.value)}
          onBlur={endEdit}
          aria-label="Color picker"
        />
        <button type="button" className="btn btn--icon btn--ghost" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      </div>

      {(
        [
          ['h', 'Hue', 0, 360, Math.round(hsl.h)],
          ['s', 'Saturation', 0, 100, Math.round(hsl.s * 100)],
          ['l', 'Lightness', 0, 100, Math.round(hsl.l * 100)],
        ] as const
      ).map(([key, label, min, max, value]) => (
        <label className="adjust__row" key={key}>
          <span className="adjust__label">{label}</span>
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onPointerDown={beginEdit}
            onKeyDown={(e) => {
              if (SLIDER_KEYS.has(e.key)) beginEdit()
            }}
            onPointerUp={endEdit}
            onBlur={endEdit}
            onChange={onSlider(key)}
            className={`adjust__range adjust__range--${key}`}
            style={
              key === 'h'
                ? undefined
                : ({
                    '--from': hslToHex({ ...hsl, [key]: 0 }),
                    '--to': hslToHex({ ...hsl, [key]: 1 }),
                    '--mid': key === 'l' ? hslToHex({ ...hsl, l: 0.5 }) : hslToHex({ ...hsl, s: 1 }),
                  } as React.CSSProperties)
            }
          />
          <span className="adjust__value">{value}</span>
        </label>
      ))}
    </div>
  )
}
