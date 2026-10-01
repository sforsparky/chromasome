import { describe, expect, it } from 'vitest'
import { hexToHsl, hexToRgb, hslToHex, isValidHex, normalizeHex, rgbToHex } from './convert'
import { seededRng } from './random'

describe('normalizeHex / isValidHex', () => {
  it('expands shorthand and lowercases', () => {
    expect(normalizeHex('ABC')).toBe('#aabbcc')
    expect(normalizeHex('#ABC')).toBe('#aabbcc')
    expect(normalizeHex('#AABBCC')).toBe('#aabbcc')
    expect(normalizeHex('  aabbcc ')).toBe('#aabbcc')
  })
  it('rejects bad input', () => {
    expect(isValidHex('#12345g')).toBe(false)
    expect(isValidHex('#12345')).toBe(false)
    expect(isValidHex('')).toBe(false)
    expect(() => normalizeHex('nope')).toThrow()
  })
})

describe('hex <-> rgb', () => {
  it('round trips', () => {
    expect(hexToRgb('#264653')).toEqual({ r: 0x26, g: 0x46, b: 0x53 })
    expect(rgbToHex({ r: 0x26, g: 0x46, b: 0x53 })).toBe('#264653')
  })
})

describe('hex <-> hsl', () => {
  it('converts known values', () => {
    expect(hexToHsl('#ff0000')).toEqual({ h: 0, s: 1, l: 0.5 })
    const gray = hexToHsl('#808080')
    expect(gray.s).toBe(0)
    expect(gray.l).toBeCloseTo(0.502, 2)
    expect(hslToHex({ h: 120, s: 1, l: 0.5 })).toBe('#00ff00')
    expect(hslToHex({ h: 240, s: 1, l: 0.5 })).toBe('#0000ff')
  })

  it('round trips random colors within ±1 per channel', () => {
    const rng = seededRng(42)
    for (let i = 0; i < 50; i++) {
      const rgb = { r: Math.floor(rng() * 256), g: Math.floor(rng() * 256), b: Math.floor(rng() * 256) }
      const hex = rgbToHex(rgb)
      const back = hexToRgb(hslToHex(hexToHsl(hex)))
      expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(1)
      expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(1)
      expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(1)
    }
  })

  it('wraps hue outside 0–360', () => {
    expect(hslToHex({ h: 360, s: 1, l: 0.5 })).toBe('#ff0000')
    expect(hslToHex({ h: -120, s: 1, l: 0.5 })).toBe('#0000ff')
  })
})
