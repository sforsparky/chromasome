import { textColorFor } from '../color/contrast'
import { nearestName } from '../color/names'
import { deriveRoles } from '../color/roles'
import { copy } from '../../copy'
import type { Palette } from '../../state/types'
import { columnSpans } from './layout'

export const PNG_WIDTH = 1600
export const PNG_HEIGHT = 900

/** `roles` sizes each column by its 60/30/10 share. */
export type PngLayout = 'equal' | 'roles'

const FONT = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'

/** Draw centered text at up to `size` px, shrinking it to fit `maxWidth`. */
function fitText(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, cx: number, y: number, maxWidth: number) {
  ctx.font = `${weight} ${size}px ${FONT}`
  const width = ctx.measureText(text).width
  if (width > maxWidth) ctx.font = `${weight} ${Math.floor((size * maxWidth) / width)}px ${FONT}`
  ctx.fillText(text, cx, y)
}

/** Render the palette as a PNG blob: one column per color with hex + name labels. */
export function renderPalettePng(palette: Palette, layout: PngLayout = 'equal'): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = PNG_WIDTH
  canvas.height = PNG_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas 2D is not available'))

  const { roles, background } = deriveRoles(palette.map((s) => s.hex))
  const spans = columnSpans(layout === 'roles' ? roles.map((r) => r.weight) : palette.map(() => 1), PNG_WIDTH)
  palette.forEach((s, i) => {
    const { x, w } = spans[i]
    ctx.fillStyle = s.hex
    ctx.fillRect(x, 0, w, PNG_HEIGHT)

    ctx.fillStyle = textColorFor(s.hex)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    const cx = x + w / 2
    const room = w - 24
    if (w >= 60) fitText(ctx, s.hex.toUpperCase(), 700, Math.min(40, w / 5), cx, PNG_HEIGHT - 120, room)
    ctx.globalAlpha = 0.8
    if (w >= 120) fitText(ctx, nearestName(s.hex), 400, Math.min(24, w / 8), cx, PNG_HEIGHT - 80, room)
    if (layout === 'roles' && w >= 60) {
      fitText(ctx, `${copy.roleLabels[roles[i].role]} ${Math.round(roles[i].weight * 100)}%`, 600, 22, cx, 72, room)
    }
    ctx.globalAlpha = 1
  })

  // The footer sits in the last column, or in the wide background column when sizing by role.
  const host = layout === 'roles' ? background : palette.length - 1
  ctx.fillStyle = textColorFor(palette[host].hex)
  ctx.globalAlpha = 0.7
  ctx.textAlign = 'right'
  ctx.font = `500 20px ${FONT}`
  ctx.fillText(`${copy.appName} · ${copy.brandHost}`, spans[host].x + spans[host].w - 24, PNG_HEIGHT - 24)
  ctx.globalAlpha = 1

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png')
  })
}
