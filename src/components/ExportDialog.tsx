import { useEffect, useMemo, useRef, useState } from 'react'
import { copy } from '../copy'
import { canCopyImages, copyBlob, copyText, downloadBlob, downloadText } from '../lib/export/clipboard'
import { exportAs, exportFilename, FORMAT_EXTENSIONS, FORMAT_LABELS, type ExportFormat } from '../lib/export/formats'
import { renderPalettePng, type PngLayout } from '../lib/export/png'
import { usePalette } from '../state/PaletteProvider'
import { CloseIcon } from './Icons'
import { useToast } from './Toast'

type Tab = ExportFormat | 'png'
const TABS: Tab[] = ['css', 'scss', 'tailwind', 'json', 'png']
const MIME: Record<ExportFormat, string> = { css: 'text/css', scss: 'text/x-scss', tailwind: 'text/javascript', json: 'application/json' }

type Props = {
  open: boolean
  onClose: () => void
  /** The board is sized by role, so the PNG starts on the matching 60·30·10 layout. */
  proportional: boolean
}

export function ExportDialog({ open, onClose, proportional }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const { palette } = usePalette()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('css')
  const [png, setPng] = useState<{ blob: Blob; url: string } | null>(null)
  const [pngLayout, setPngLayout] = useState<PngLayout>('equal')

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      setPngLayout(proportional ? 'roles' : 'equal')
      d.showModal()
    }
    if (!open && d.open) d.close()
  }, [open, proportional])

  // Render the PNG lazily when its tab is shown; revoke the preview URL afterwards.
  useEffect(() => {
    if (!open || tab !== 'png') return
    let cancelled = false
    renderPalettePng(palette, pngLayout).then((blob) => {
      if (cancelled) return
      setPng({ blob, url: URL.createObjectURL(blob) })
    })
    return () => {
      cancelled = true
      setPng((p) => {
        if (p) URL.revokeObjectURL(p.url)
        return null
      })
    }
  }, [open, tab, palette, pngLayout])

  const url = typeof window !== 'undefined' ? window.location.href : undefined
  const text = useMemo(() => (tab === 'png' ? '' : exportAs(tab, palette, url)), [tab, palette, url])

  const onCopy = async () => {
    if (tab === 'png') {
      if (!png) return
      await copyBlob(png.blob)
    } else {
      await copyText(text)
    }
    toast.show(copy.toastCopied)
  }

  const onDownload = () => {
    if (tab === 'png') {
      if (!png) return
      downloadBlob(png.blob, exportFilename(palette, 'png').replace(/\.png$/, pngLayout === 'roles' ? '-roles.png' : '.png'))
    } else {
      downloadText(text, exportFilename(palette, FORMAT_EXTENSIONS[tab]), MIME[tab])
    }
    toast.show(copy.toastDownloaded)
  }

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-label={copy.export}>
      <div className="dialog__head">
        <h2 className="dialog__title">{copy.export}</h2>
        <button type="button" className="btn btn--icon btn--ghost" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={`tab${tab === t ? ' tab--active' : ''}`} onClick={() => setTab(t)}>
            {t === 'png' ? 'PNG' : FORMAT_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="dialog__body">
        {tab === 'png' ? (
          <>
            <div className="segmented" role="group" aria-label={copy.pngLayout}>
              {(['equal', 'roles'] as const).map((l) => (
                <button key={l} type="button" className="segmented__btn" aria-pressed={pngLayout === l} onClick={() => setPngLayout(l)}>
                  {l === 'equal' ? copy.pngEqual : copy.pngRoles}
                </button>
              ))}
            </div>
            {png ? <img className="export__preview" src={png.url} alt="Palette preview" /> : <div className="export__loading">Rendering…</div>}
          </>
        ) : (
          <pre className="export__code">
            <code>{text}</code>
          </pre>
        )}
      </div>

      <div className="dialog__foot">
        {(tab !== 'png' || canCopyImages()) && (
          <button type="button" className="btn" onClick={onCopy} disabled={tab === 'png' && !png}>
            Copy
          </button>
        )}
        <button type="button" className="btn btn--primary" onClick={onDownload} disabled={tab === 'png' && !png}>
          Download
        </button>
      </div>
    </dialog>
  )
}
