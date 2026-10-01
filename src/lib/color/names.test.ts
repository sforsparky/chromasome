import { describe, expect, it } from 'vitest'
import { CSS_COLORS, nearestName } from './names'

describe('nearestName', () => {
  it('returns exact matches', () => {
    expect(nearestName('#ff0000')).toBe('Red')
    expect(nearestName('#fffafa')).toBe('Snow')
    expect(nearestName('#663399')).toBe('Rebecca Purple')
  })
  it('returns the closest named color', () => {
    expect(nearestName('#000001')).toBe('Black')
    expect(nearestName('#fe0101')).toBe('Red')
  })
  it('has no duplicate hexes', () => {
    const hexes = CSS_COLORS.map((c) => c.hex)
    expect(new Set(hexes).size).toBe(hexes.length)
  })
})
