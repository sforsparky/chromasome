import { hexToHsl, hslToHex, rgbToHex, rgbToHsl } from '../color/convert'
import { colorDistance } from '../color/names'
import { MIN_COLORS } from '../../state/types'
import { quantize, type ColorBox } from './medianCut'

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const SAMPLE_SIZE = 120

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Image decode failed'))
      img.src = url
    })
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

/** Redmean distance below which two boxes count as the same color (scale is 0–~765). */
const DISTINCT_THRESHOLD = 30

/**
 * Choose up to k boxes: most populous first, then repeatedly the box furthest
 * from everything already chosen. Stops early when only near-duplicates remain,
 * so a flat two-color image yields two colors, not five.
 */
export function selectDistinct(boxes: ColorBox[], k: number, totalPixels: number): ColorBox[] {
  let pool = boxes.filter((b) => b.count >= totalPixels * 0.01)
  if (pool.length < k) pool = boxes
  if (pool.length === 0) return []
  const chosen: ColorBox[] = [pool[0]]
  const rest = pool.slice(1)
  while (chosen.length < k && rest.length > 0) {
    let bestIdx = -1
    let bestMin = -1
    rest.forEach((cand, i) => {
      const minDist = Math.min(...chosen.map((c) => colorDistance(cand, c)))
      if (minDist > bestMin) {
        bestMin = minDist
        bestIdx = i
      }
    })
    if (bestIdx === -1 || bestMin < DISTINCT_THRESHOLD) break
    chosen.push(rest.splice(bestIdx, 1)[0])
  }
  return chosen
}

/** Guarantee at least MIN_COLORS by adding a lighter/darker variant of the first color. */
export function padToMinimum(hexes: string[]): string[] {
  const out = hexes.slice()
  if (out.length === 0) return out
  const base = hexToHsl(out[0])
  let step = 0
  while (out.length < MIN_COLORS) {
    const l = base.l < 0.5 ? Math.min(0.9, base.l + 0.35 + step * 0.1) : Math.max(0.1, base.l - 0.35 - step * 0.1)
    out.push(hslToHex({ ...base, l }))
    step++
  }
  return out
}

/** Extract `k` representative colors from an image file, sorted dark to light. */
export async function extractPalette(file: File, k = 5): Promise<string[]> {
  const bitmap = await loadBitmap(file)
  const w = 'width' in bitmap ? bitmap.width : 0
  const h = 'height' in bitmap ? bitmap.height : 0
  if (!w || !h) throw new Error('Empty image')

  const scale = Math.min(1, SAMPLE_SIZE / Math.max(w, h))
  const cw = Math.max(1, Math.round(w * scale))
  const ch = Math.max(1, Math.round(h * scale))
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas 2D is not available')
  ctx.drawImage(bitmap, 0, 0, cw, ch)
  if ('close' in bitmap) bitmap.close()

  const { data } = ctx.getImageData(0, 0, cw, ch)
  const boxes = quantize(data, 16)
  const chosen = selectDistinct(boxes, k, cw * ch)
  if (chosen.length === 0) throw new Error('No opaque pixels found')

  const hexes = chosen
    .map((b) => ({ hex: rgbToHex(b), l: rgbToHsl(b).l }))
    .sort((a, b) => a.l - b.l)
    .map((c) => c.hex)
  return padToMinimum(hexes)
}
