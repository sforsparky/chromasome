import { copy } from '../copy'
import { copyText } from '../lib/export/clipboard'
import { usePalette } from '../state/PaletteProvider'
import { DownloadIcon, ImageIcon, LinkIcon, RedoIcon, UndoIcon } from './Icons'
import { useToast } from './Toast'

type Props = {
  onExport: () => void
  onExtract: () => void
}

export function Toolbar({ onExport, onExtract }: Props) {
  const { dispatch, canUndo, canRedo } = usePalette()
  const toast = useToast()

  const copyCode = async () => {
    await copyText(window.location.href)
    toast.show(copy.toastCopiedCode)
  }

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

      <div className="toolbar__group toolbar__group--right">
        <button type="button" className="btn" onClick={copyCode}>
          <LinkIcon /> {copy.colorCode}
        </button>
        <button type="button" className="btn" onClick={onExtract}>
          <ImageIcon /> {copy.extractDna}
        </button>
        <button type="button" className="btn" onClick={onExport}>
          <DownloadIcon /> {copy.export}
        </button>
      </div>
    </nav>
  )
}
