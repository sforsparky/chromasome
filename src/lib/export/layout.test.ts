import { describe, expect, it } from 'vitest'
import { columnSpans } from './layout'

describe('columnSpans', () => {
  it('covers the width exactly with contiguous columns', () => {
    for (const weights of [[1, 1, 1], [0.6, 0.3, 0.1], [0.46, 0.23, 0.115, 0.115, 0.08], Array(7).fill(1)]) {
      const spans = columnSpans(weights, 1600)
      expect(spans[0].x).toBe(0)
      spans.forEach((s, i) => i > 0 && expect(s.x).toBe(spans[i - 1].x + spans[i - 1].w))
      expect(spans.at(-1)!.x + spans.at(-1)!.w).toBe(1600)
    }
  })

  it('sizes columns by weight', () => {
    expect(columnSpans([0.6, 0.3, 0.1], 1600).map((s) => s.w)).toEqual([960, 480, 160])
  })
})
