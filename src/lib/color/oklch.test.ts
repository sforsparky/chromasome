import { describe, expect, it } from 'vitest'
import { hexToRgb } from './convert'
import { greyOf, hexToOklch, inGamut, lstar, oklchToHex, toGamut } from './oklch'
import { seededRng } from './random'

describe('oklch', () => {
  it('matches known values', () => {
    const red = hexToOklch('#ff0000')
    expect(red.l).toBeCloseTo(0.628, 3)
    expect(red.c).toBeCloseTo(0.2577, 3)
    expect(red.h).toBeCloseTo(29.23, 1)
    expect(hexToOklch('#ffffff').l).toBeCloseTo(1, 4)
    expect(hexToOklch('#ffffff').c).toBeLessThan(1e-4)
  })

  it('round-trips hexes', () => {
    const rng = seededRng(11)
    for (let i = 0; i < 200; i++) {
      const hex = '#' + Math.floor(rng() * 0xffffff).toString(16).padStart(6, '0')
      expect(oklchToHex(hexToOklch(hex))).toBe(hex)
    }
  })

  it('maps out-of-gamut colors into sRGB, keeping lightness and hue', () => {
    const wild = { l: 0.9, c: 0.35, h: 140 }
    expect(inGamut(wild)).toBe(false)
    const mapped = toGamut(wild)
    expect(inGamut(mapped)).toBe(true)
    expect(mapped.c).toBeLessThan(wild.c)
    expect(mapped.l).toBe(wild.l)
    expect(mapped.h).toBe(wild.h)
  })

  it('measures the lesson palettes', () => {
    expect(lstar('#F3613C')).toBeCloseTo(59.8, 0)
    expect(lstar('#13403B')).toBeCloseTo(24.1, 0)
    expect(lstar('#F4EEE2')).toBeCloseTo(94.3, 0)
    expect(hexToOklch('#F3613C').c).toBeCloseTo(0.187, 2)
    expect(hexToOklch('#13403B').c).toBeCloseTo(0.049, 2)
  })

  it('greyOf keeps lightness and drops color', () => {
    for (const hex of ['#f3613c', '#13403b', '#e9c46a', '#2a9d8f']) {
      const grey = greyOf(hex)
      const { r, g, b } = hexToRgb(grey)
      expect(r).toBe(g)
      expect(g).toBe(b)
      expect(Math.abs(lstar(grey) - lstar(hex))).toBeLessThan(1)
    }
  })
})
