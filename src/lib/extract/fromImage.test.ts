import { describe, expect, it } from 'vitest'
import { padToMinimum, selectDistinct } from './fromImage'

describe('selectDistinct', () => {
  it('skips near-duplicate boxes and stops early', () => {
    const boxes = [
      { r: 230, g: 57, b: 70, count: 100 },
      { r: 231, g: 57, b: 70, count: 90 }, // duplicate of the first
      { r: 29, g: 53, b: 87, count: 80 },
      { r: 29, g: 54, b: 87, count: 70 }, // duplicate of the third
      { r: 241, g: 250, b: 238, count: 60 },
    ]
    const chosen = selectDistinct(boxes, 5, 400)
    expect(chosen).toHaveLength(3)
    expect(chosen.map((b) => b.r)).toEqual(expect.arrayContaining([230, 29, 241]))
  })

  it('drops boxes under 1% of pixels when enough remain', () => {
    const boxes = [
      { r: 0, g: 0, b: 0, count: 1000 },
      { r: 255, g: 255, b: 255, count: 1000 },
      { r: 255, g: 0, b: 0, count: 5 }, // noise
    ]
    const chosen = selectDistinct(boxes, 2, 2005)
    expect(chosen.map((b) => b.r)).toEqual([0, 255])
    expect(chosen.find((b) => b.g === 0 && b.r === 255)).toBeUndefined()
  })

  it('returns [] for no boxes', () => {
    expect(selectDistinct([], 5, 0)).toEqual([])
  })
})

describe('padToMinimum', () => {
  it('adds a contrasting variant for a single color', () => {
    const out = padToMinimum(['#1d3557'])
    expect(out).toHaveLength(2)
    expect(out[0]).toBe('#1d3557')
    expect(out[1]).not.toBe('#1d3557')
  })
  it('leaves enough colors alone', () => {
    expect(padToMinimum(['#000000', '#ffffff', '#ff0000'])).toHaveLength(3)
  })
})
