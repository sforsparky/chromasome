export type Rng = () => number // returns [0, 1)

export const rand = (min: number, max: number, rng: Rng = Math.random): number => min + rng() * (max - min)

export const randInt = (min: number, max: number, rng: Rng = Math.random): number =>
  Math.floor(rand(min, max + 1, rng))

export const pick = <T>(items: ReadonlyArray<T>, rng: Rng = Math.random): T => items[Math.floor(rng() * items.length)]

export function shuffle<T>(items: ReadonlyArray<T>, rng: Rng = Math.random): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Pick an item according to weights (same length as items). */
export function pickWeighted<T>(items: ReadonlyArray<T>, weights: ReadonlyArray<number>, rng: Rng = Math.random): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let roll = rng() * total
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i]
    if (roll < 0) return items[i]
  }
  return items[items.length - 1]
}

/** Small deterministic PRNG (mulberry32) for tests. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
