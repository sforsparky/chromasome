import { textColorFor } from '../color/contrast'
import { nearestName } from '../color/names'
import { copy } from '../../copy'
import type { Palette } from '../../state/types'

export const PNG_WIDTH = 1600
export const PNG_HEIGHT = 900

/** Render the palette as a PNG blob: equal columns with hex + name labels. */
export function renderPalettePng(palette: Palette): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = PNG_WIDTH
  canvas.height = PNG_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas 2D is not available'))

  const colW = PNG_WIDTH / palette.length
  palette.forEach((s, i) => {
    const x = Math.round(i * colW)
    const w = Math.round((i + 1) * colW) - x
    ctx.fillStyle = s.hex
    ctx.fillRect(x, 0, w, PNG_HEIGHT)

    const text = textColorFor(s.hex)
    ctx.fillStyle = text
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    const cx = x + w / 2
    ctx.font = `700 ${Math.min(40, w / 5)}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
    ctx.fillText(s.hex.toUpperCase(), cx, PNG_HEIGHT - 120)
    ctx.font = `400 ${Math.min(24, w / 8)}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
    ctx.globalAlpha = 0.8
    ctx.fillText(nearestName(s.hex), cx, PNG_HEIGHT - 80)
    ctx.globalAlpha = 1
  })

  const last = palette[palette.length - 1]
  ctx.fillStyle = textColorFor(last.hex)
  ctx.globalAlpha = 0.7
  ctx.textAlign = 'right'
  ctx.font = '500 20px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
  ctx.fillText(`${copy.appName} · ${copy.brandHost}`, PNG_WIDTH - 24, PNG_HEIGHT - 24)
  ctx.globalAlpha = 1

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png')
  })
}
