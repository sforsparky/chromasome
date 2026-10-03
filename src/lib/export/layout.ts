export type Span = { x: number; w: number }

/** Split `width` into whole-pixel columns proportional to `weights`, with no gaps or overlap. */
export function columnSpans(weights: number[], width: number): Span[] {
  const total = weights.reduce((a, b) => a + b, 0)
  let acc = 0
  return weights.map((w) => {
    const x = Math.round((acc / total) * width)
    acc += w
    return { x, w: Math.round((acc / total) * width) - x }
  })
}
