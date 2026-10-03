import { hexToRgb, srgbToLinear, type Rgb } from './convert'

export const TEXT_LIGHT = '#ffffff'
export const TEXT_DARK = '#111111'

/** WCAG 2.x relative luminance (0 = black, 1 = white). */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * srgbToLinear(r / 255) + 0.7152 * srgbToLinear(g / 255) + 0.0722 * srgbToLinear(b / 255)
}

/** WCAG contrast ratio between two hex colors, 1–21. */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexToRgb(hexA))
  const lb = relativeLuminance(hexToRgb(hexB))
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** The text color (white or near-black) with the higher contrast on `hex`. */
export function textColorFor(hex: string): string {
  return contrastRatio(hex, TEXT_LIGHT) >= contrastRatio(hex, TEXT_DARK) ? TEXT_LIGHT : TEXT_DARK
}

export function wcagLevel(ratio: number): 'AAA' | 'AA' | 'AA Large' | 'Fail' {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA Large'
  return 'Fail'
}
