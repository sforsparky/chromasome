import { hexToRgb, linearToSrgb, rgbToHex, srgbToLinear } from './convert'
import { relativeLuminance } from './contrast'

/** OKLCH: l 0–1 (perceived lightness), c 0–~0.4 (chroma), h 0–360. */
export type Oklch = { l: number; c: number; h: number }

const GAMUT_EPS = 1e-4
const MAX_C = 0.4

function oklabToLinearRgb(l: number, a: number, b: number): [number, number, number] {
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
}

function toLinearRgb({ l, c, h }: Oklch): [number, number, number] {
  const rad = (h * Math.PI) / 180
  return oklabToLinearRgb(l, c * Math.cos(rad), c * Math.sin(rad))
}

export function hexToOklch(hex: string): Oklch {
  const { r, g, b } = hexToRgb(hex)
  const lr = srgbToLinear(r / 255)
  const lg = srgbToLinear(g / 255)
  const lb = srgbToLinear(b / 255)
  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const l = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
  const h = ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360
  return { l, c: Math.hypot(a, bb), h }
}

export function inGamut(o: Oklch): boolean {
  return toLinearRgb(o).every((v) => v >= -GAMUT_EPS && v <= 1 + GAMUT_EPS)
}

/** The highest chroma sRGB can show at this lightness and hue. */
export function maxChroma(l: number, h: number): number {
  let lo = 0
  let hi = MAX_C
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2
    if (inGamut({ l, c: mid, h })) lo = mid
    else hi = mid
  }
  return lo
}

/** Reduce chroma (keeping lightness and hue) until the color fits in sRGB. */
export function toGamut(o: Oklch): Oklch {
  const l = Math.min(1, Math.max(0, o.l))
  const c = Math.max(0, o.c)
  return inGamut({ l, c, h: o.h }) ? { l, c, h: o.h } : { l, c: Math.min(c, maxChroma(l, o.h)), h: o.h }
}

export function oklchToHex(o: Oklch): string {
  const [r, g, b] = toLinearRgb(toGamut(o))
  const ch = (v: number) => linearToSrgb(Math.min(1, Math.max(0, v))) * 255
  return rgbToHex({ r: ch(r), g: ch(g), b: ch(b) })
}

/** CIE L* (0–100), the lightness a greyscale "squint" sees. */
export function lstar(hex: string): number {
  const y = relativeLuminance(hexToRgb(hex))
  return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y
}

/** OKLCH l for a target L*; exact for greys, close for colors. */
export function lstarToOkL(ls: number): number {
  return (ls + 16) / 116
}

/** The neutral grey with the same luminance, for the squint view. */
export function greyOf(hex: string): string {
  const v = linearToSrgb(relativeLuminance(hexToRgb(hex))) * 255
  return rgbToHex({ r: v, g: v, b: v })
}
