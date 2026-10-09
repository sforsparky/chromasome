import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { copy } from '../copy'
import { copyText } from '../lib/export/clipboard'
import { usePalette } from '../state/PaletteProvider'
import { DownloadIcon, EyeIcon, ImageIcon, InfoIcon, LinkIcon, MoreIcon, RatioIcon, RedoIcon, UndoIcon } from './Icons'
import { useToast } from './Toast'

type Props = {
  onExport: () => void
  onExtract: () => void
  squint: boolean
  onSquint: (on: boolean) => void
  proportional: boolean
  onProportional: (on: boolean) => void
  checksOpen: boolean
  onChecks: (open: boolean) => void
  checksButtonRef: RefObject<HTMLButtonElement | null>
  /** The palette-checks pop-over, anchored above the ⓘ button. */
  checksPopover: ReactNode
}

type Action = { label: string; icon: ReactNode; run: () => void }

/** Phones: the secondary actions fold into a ⋮ menu so the toolbar fits on one row. */
function MoreMenu({ actions }: { actions: Action[] }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="toolbar__more" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className="btn btn--icon btn--toggle"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={copy.more}
        title={copy.more}
      >
        <MoreIcon />
      </button>
      {open && (
        <div className="menu" role="menu" aria-label={copy.more}>
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              className="menu__item"
              onClick={() => {
                setOpen(false)
                a.run()
              }}
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Toolbar(props: Props) {
  const { onExport, onExtract, squint, onSquint, proportional, onProportional, checksOpen, onChecks, checksButtonRef, checksPopover } = props
  const { dispatch, canUndo, canRedo } = usePalette()
  const toast = useToast()

  const copyCode = async () => {
    await copyText(window.location.href)
    toast.show(copy.toastCopiedCode)
  }

  const actions: Action[] = [
    { label: copy.colorCode, icon: <LinkIcon />, run: copyCode },
    { label: copy.extractPhoto, icon: <ImageIcon />, run: onExtract },
    { label: copy.export, icon: <DownloadIcon />, run: onExport },
  ]

  return (
    <nav className="toolbar" aria-label="Palette actions">
      <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'MUTATE' })}>
        {copy.mutate}
        <kbd className="btn__hint">{copy.mutateHint}</kbd>
      </button>

      <div className="toolbar__group">
        <button type="button" className="btn btn--icon" onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo} aria-label={copy.undo} title={copy.undo}>
          <UndoIcon />
        </button>
        <button type="button" className="btn btn--icon" onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo} aria-label={copy.redo} title={copy.redo}>
          <RedoIcon />
        </button>
      </div>

      <div className="toolbar__group toolbar__group--view">
        <button type="button" className="btn btn--icon btn--toggle" onClick={() => onSquint(!squint)} aria-pressed={squint} aria-label={copy.squint} title={copy.squint}>
          <EyeIcon />
        </button>
        <button
          type="button"
          className="btn btn--icon btn--toggle"
          onClick={() => onProportional(!proportional)}
          aria-pressed={proportional}
          aria-label={copy.proportional}
          title={copy.proportional}
        >
          <RatioIcon />
        </button>
        <button
          ref={checksButtonRef}
          type="button"
          className="btn btn--icon btn--toggle"
          onClick={() => onChecks(!checksOpen)}
          aria-expanded={checksOpen}
          aria-controls="checks-panel"
          aria-label={copy.checks}
          title={copy.checks}
        >
          <InfoIcon />
        </button>
        {checksPopover}
      </div>

      <div className="toolbar__group toolbar__group--right">
        {actions.map((a) => (
          <button key={a.label} type="button" className="btn" onClick={a.run}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      <MoreMenu actions={actions} />
    </nav>
  )
}
