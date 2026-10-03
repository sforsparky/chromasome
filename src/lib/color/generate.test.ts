import { describe, expect, it } from 'vitest'
import { betweenColors, generatePalette } from './generate'
import { hexToHsl, isValidHex } from './convert'
import { evaluatePalette } from './checks'
import { hexToOklch, lstar } from './oklch'
import { seededRng } from './random'
import { LOUD_C, QUIET_C } from './roles'
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

  it('passes all three lesson checks in the large majority of runs', () => {
    for (const n of [3, 5]) {
      const rng = seededRng(2024 + n)
      const runs = 200
      let ok = 0
      for (let r = 0; r < runs; r++) {
        const out = generatePalette(palette(Array(n).fill('#000000')), rng)
        if (evaluatePalette(out.map((s) => s.hex)).passed === 3) ok++
      }
      expect(ok / runs).toBeGreaterThanOrEqual(0.95)
    }
  })

  it('makes exactly one loud color unless the palette is calm', () => {
    const rng = seededRng(17)
    const runs = 600
    let calm = 0
    let oneLoud = 0
    for (let r = 0; r < runs; r++) {
      const chromas = generatePalette(palette(Array(5).fill('#000000')), rng).map((s) => hexToOklch(s.hex).c)
      const loud = chromas.filter((c) => c >= LOUD_C).length
      if (loud === 0) calm++
      else if (loud === 1 && chromas.filter((c) => c > QUIET_C).length === 1) oneLoud++
    }
    expect(calm / runs).toBeGreaterThan(0.08)
    expect(calm / runs).toBeLessThan(0.28)
    expect(oneLoud / (runs - calm)).toBeGreaterThanOrEqual(0.95)
  })

  it('keeps a locked loud color as the only loud one', () => {
    const rng = seededRng(23)
    let ok = 0
    for (let r = 0; r < 200; r++) {
      const out = generatePalette(palette(['#000000', '#e64435', '#000000', '#000000', '#000000'], [1]), rng)
      if (out.filter((s) => hexToOklch(s.hex).c >= LOUD_C).length === 1) ok++
    }
    expect(ok / 200).toBeGreaterThanOrEqual(0.95)
  })

  it('keeps new colors away from a locked color\'s lightness', () => {
    const rng = seededRng(31)
    let ok = 0
    for (let r = 0; r < 200; r++) {
      const out = generatePalette(palette(['#13403b', '#000000', '#000000'], [0]), rng)
      if (out.slice(1).every((s) => Math.abs(lstar(s.hex) - lstar('#13403b')) >= 15)) ok++
    }
    expect(ok / 200).toBeGreaterThanOrEqual(0.95)
  })

  it('works at the size limits', () => {
    const rng = seededRng(3)
    expect(generatePalette(palette(['#000000', '#ffffff']), rng)).toHaveLength(2)
    expect(generatePalette(palette(Array(10).fill('#123456')), rng)).toHaveLength(10)
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
