import { describe, expect, it } from 'vitest'
import { quantize } from './medianCut'

function buffer(blocks: Array<{ rgb: [number, number, number]; count: number; alpha?: number }>): Uint8ClampedArray {
  const total = blocks.reduce((n, b) => n + b.count, 0)
  const data = new Uint8ClampedArray(total * 4)
  let p = 0
  for (const b of blocks) {
    for (let i = 0; i < b.count; i++, p++) {
      data[p * 4] = b.rgb[0]
      data[p * 4 + 1] = b.rgb[1]
      data[p * 4 + 2] = b.rgb[2]
      data[p * 4 + 3] = b.alpha ?? 255
    }
  }
  return data
}

describe('quantize', () => {
  it('finds flat color blocks and ignores transparent pixels', () => {
    const data = buffer([
      { rgb: [255, 0, 0], count: 100 },
      { rgb: [0, 255, 0], count: 100 },
      { rgb: [0, 0, 255], count: 100 },
      { rgb: [255, 255, 255], count: 10, alpha: 0 },
    ])
    const boxes = quantize(data, 8)
    const top = boxes.slice(0, 3).map((b) => [b.r, b.g, b.b])
    expect(top).toEqual(expect.arrayContaining([[255, 0, 0], [0, 255, 0], [0, 0, 255]]))
    const counted = boxes.reduce((n, b) => n + b.count, 0)
    expect(counted).toBe(300)
  })

  it('honors boxCount', () => {
    const data = buffer(Array.from({ length: 40 }, (_, i) => ({ rgb: [i * 6, 255 - i * 6, (i * 37) % 256] as [number, number, number], count: 5 })))
    expect(quantize(data, 4).length).toBeLessThanOrEqual(4)
    expect(quantize(data, 16).length).toBeLessThanOrEqual(16)
  })

  it('returns [] for fully transparent input', () => {
    expect(quantize(buffer([{ rgb: [1, 2, 3], count: 20, alpha: 0 }]))).toEqual([])
  })
})
