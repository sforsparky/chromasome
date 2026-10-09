import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { copy } from '../copy'
import { copyText } from '../lib/export/clipboard'
import { usePalette } from '../state/PaletteProvider'
import { ChecksIcon, CookieIcon, DownloadIcon, EyeIcon, ImageIcon, LinkIcon, MoreIcon, RatioIcon, RedoIcon, UndoIcon } from './Icons'
import { track } from '../lib/analytics/ga'
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
  /** The palette-checks pop-over, shown above the "Size board by role" button. */
  checksPopover: ReactNode
  /** Open the checks sheet when sizing by role is switched on by touch (off after "Don't show again"). */
  autoChecks: boolean
  /** Phones: "Cookie settings" in the ⋮ menu, only where cookie consent applies. */
  onCookieSettings?: () => void
}

const HOVER_OPEN_MS = 250
const HOVER_CLOSE_MS = 200

/**
 * "Size board by role" toggle that also reveals the palette checks: on hover or keyboard focus
 * where there is a pointer, and when it is switched on by touch (phones have no hover).
 */
function SizeByRole({ proportional, onProportional, checksOpen, onChecks, buttonRef, popover, autoChecks }: {
  autoChecks: boolean
  proportional: boolean
  onProportional: (on: boolean) => void
  checksOpen: boolean
  onChecks: (open: boolean) => void
  buttonRef: RefObject<HTMLButtonElement | null>
  popover: ReactNode
}) {
  const timer = useRef<number | undefined>(undefined)
  const lastPointer = useRef('mouse')
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const schedule = (open: boolean, ms: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => onChecks(open), ms)
  }

  return (
    <span
      className="toolbar__checks"
      onPointerEnter={(e) => e.pointerType !== 'touch' && schedule(true, checksOpen ? 0 : HOVER_OPEN_MS)}
      onPointerLeave={(e) => e.pointerType !== 'touch' && schedule(false, HOVER_CLOSE_MS)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) schedule(false, 0)
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="btn btn--icon btn--toggle"
        onPointerDown={(e) => (lastPointer.current = e.pointerType)}
        onFocus={(e) => e.currentTarget.matches(':focus-visible') && schedule(true, 0)}
        onClick={() => {
          const on = !proportional
          onProportional(on)
          if (lastPointer.current === 'touch' && (autoChecks || !on)) schedule(on, 0)
          lastPointer.current = 'mouse'
        }}
        aria-pressed={proportional}
        aria-controls="checks-panel"
        aria-label={copy.proportional}
        title={checksOpen ? undefined : copy.proportional}
      >
        <RatioIcon />
      </button>
      {popover}
    </span>
  )
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
  const { onExport, onExtract, squint, onSquint, proportional, onProportional, checksOpen, onChecks, checksButtonRef, checksPopover, autoChecks, onCookieSettings } = props
  const { dispatch, canUndo, canRedo } = usePalette()
  const toast = useToast()

  const copyCode = async () => {
    await copyText(window.location.href)
    toast.show(copy.toastCopiedCode)
    track('copy_color_code')
  }

  const actions: Action[] = [
    { label: copy.colorCode, icon: <LinkIcon />, run: copyCode },
    { label: copy.extractPhoto, icon: <ImageIcon />, run: onExtract },
    { label: copy.export, icon: <DownloadIcon />, run: onExport },
  ]

  return (
    <nav className="toolbar" aria-label="Palette actions">
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => {
          dispatch({ type: 'MUTATE' })
          track('mutate', { source: 'button' })
        }}
      >
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
        <SizeByRole
          proportional={proportional}
          onProportional={onProportional}
          checksOpen={checksOpen}
          onChecks={onChecks}
          buttonRef={checksButtonRef}
          popover={checksPopover}
          autoChecks={autoChecks}
        />
      </div>

      <div className="toolbar__group toolbar__group--right">
        {actions.map((a) => (
          <button key={a.label} type="button" className="btn" onClick={a.run}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      <MoreMenu
        actions={[
          ...actions,
          { label: copy.checksTitle, icon: <ChecksIcon />, run: () => onChecks(true) },
          ...(onCookieSettings ? [{ label: copy.cookieSettings, icon: <CookieIcon />, run: onCookieSettings }] : []),
        ]}
      />
    </nav>
  )
}
