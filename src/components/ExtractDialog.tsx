import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type DragEvent } from 'react'
import { copy } from '../copy'
import { textColorFor } from '../lib/color/contrast'
import { extractPalette, MAX_IMAGE_BYTES } from '../lib/extract/fromImage'
import { usePalette } from '../state/PaletteProvider'
import { CloseIcon, ImageIcon } from './Icons'
import { useToast } from './Toast'

type Props = { open: boolean; onClose: () => void }

export function ExtractDialog({ open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { dispatch } = usePalette()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [hexes, setHexes] = useState<string[] | null>(null)
  const [over, setOver] = useState(false)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  const reset = () => {
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p)
      return null
    })
    setHexes(null)
    setBusy(false)
    setOver(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const close = () => {
    reset()
    onClose()
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.show(copy.toastBadImage)
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.show(copy.toastImageTooBig)
      return
    }
    reset()
    setBusy(true)
    setPreview(URL.createObjectURL(file))
    try {
      setHexes(await extractPalette(file, 5))
    } catch {
      toast.show(copy.toastExtractFailed)
      reset()
    } finally {
      setBusy(false)
    }
  }

  const onInput = (e: ChangeEvent<HTMLInputElement>) => handleFile(e.target.files?.[0])

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  const useStrand = () => {
    if (!hexes) return
    dispatch({ type: 'LOAD', hexes })
    close()
  }

  return (
    <dialog ref={ref} className="dialog" onClose={close} aria-label={copy.extractDna}>
      <div className="dialog__head">
        <h2 className="dialog__title">{copy.extractDna}</h2>
        <button type="button" className="btn btn--icon btn--ghost" onClick={close} aria-label="Close">
          <CloseIcon />
        </button>
      </div>

      <div className="dialog__body">
        <label
          className={`dropzone${over ? ' dropzone--over' : ''}${preview ? ' dropzone--has-image' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
        >
          <input ref={inputRef} type="file" accept="image/*" onChange={onInput} className="dropzone__input" />
          {preview ? (
            <img src={preview} alt="" className="dropzone__preview" />
          ) : (
            <span className="dropzone__hint">
              <ImageIcon width={28} height={28} />
              {copy.dropImage}
            </span>
          )}
        </label>

        {busy && <p className="extract__status">{copy.extracting}</p>}

        {hexes && (
          <div className="extract__strand" aria-label="Extracted colors">
            {hexes.map((hex, i) => (
              <div key={hex} className="extract__swatch" style={{ backgroundColor: hex, color: textColorFor(hex), '--i': i } as CSSProperties}>
                {hex.slice(1).toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dialog__foot">
        <button type="button" className="btn btn--primary" onClick={useStrand} disabled={!hexes}>
          {copy.useStrand}
        </button>
      </div>
    </dialog>
  )
}
