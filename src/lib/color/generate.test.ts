import { describe, expect, it } from 'vitest'
import { betweenColors, candidateColors, generatePalette } from './generate'
import { hexToHsl, isValidHex } from './convert'
import { seededRng } from './random'
import type { Palette } from '../../state/types'

function palette(hexes: string[], lockedIdx: number[] = []): Palette {
  return hexes.map((hex, i) => ({ id: `id-${i}`, hex, locked: lockedIdx.includes(i) }))
}

describe('generatePalette', () => {
  it('preserves length, ids, and locked swatches', () => {
    const rng = seededRng(7)
    const input = palette(['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'], [1, 3])
    const out = generatePalette(input, rng)
    expect(out).toHaveLength(5)
    out.forEach((s, i) => {
      expect(s.id).toBe(input[i].id)
      expect(isValidHex(s.hex)).toBe(true)
    })
    expect(out[1]).toEqual(input[1])
    expect(out[3]).toEqual(input[3])
  })

  it('changes unlocked swatches', () => {
    const rng = seededRng(99)
    const input = palette(['#264653', '#2a9d8f', '#e9c46a'])
    const out = generatePalette(input, rng)
    expect(out.some((s, i) => s.hex !== input[i].hex)).toBe(true)
  })

  it('keeps adjacent lightness apart in the large majority of runs', () => {
    const rng = seededRng(2024)
    let ok = 0
    const runs = 200
    for (let r = 0; r < runs; r++) {
      const out = generatePalette(palette(['#000000', '#000000', '#000000', '#000000', '#000000']), rng)
      const ls = out.map((s) => hexToHsl(s.hex).l)
      const good = ls.every((l, i) => i === 0 || Math.abs(l - ls[i - 1]) >= 0.09)
      if (good) ok++
    }
    expect(ok / runs).toBeGreaterThanOrEqual(0.95)
  })

  it('works at the size limits', () => {
    const rng = seededRng(3)
    expect(generatePalette(palette(['#000000', '#ffffff']), rng)).toHaveLength(2)
    expect(generatePalette(palette(Array(10).fill('#123456')), rng)).toHaveLength(10)
  })
})

describe('candidateColors', () => {
  it('returns n distinct valid colors near the final hue, never the final itself', () => {
    const rng = seededRng(11)
    const final = '#2a9d8f'
    const out = candidateColors(final, 4, rng)
    expect(out).toHaveLength(4)
    expect(new Set(out).size).toBe(4)
    const fh = hexToHsl(final).h
    for (const hex of out) {
      expect(isValidHex(hex)).toBe(true)
      expect(hex).not.toBe(final)
      const dh = Math.abs(((hexToHsl(hex).h - fh + 540) % 360) - 180)
      expect(dh).toBeLessThanOrEqual(30)
    }
  })
  it('handles grays and extremes without looping forever', () => {
    expect(candidateColors('#000000', 4, seededRng(1)).length).toBeGreaterThan(0)
    expect(candidateColors('#ffffff', 4, seededRng(2)).length).toBeGreaterThan(0)
    expect(candidateColors('#808080', 4, seededRng(3)).length).toBeGreaterThan(0)
  })
})

describe('betweenColors', () => {
  it('returns a valid hex in every anchor configuration', () => {
    const rng = seededRng(5)
    expect(isValidHex(betweenColors('#ff0000', '#0000ff', rng))).toBe(true)
    expect(isValidHex(betweenColors('#ff0000', undefined, rng))).toBe(true)
    expect(isValidHex(betweenColors(undefined, '#0000ff', rng))).toBe(true)
    expect(isValidHex(betweenColors(undefined, undefined, rng))).toBe(true)
  })
  it('lands between two neighbors in lightness', () => {
    const mid = hexToHsl(betweenColors('#222222', '#dddddd'))
    expect(mid.l).toBeGreaterThan(0.3)
    expect(mid.l).toBeLessThan(0.7)
  })
})
