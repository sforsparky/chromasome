import { hexToHsl, hslToHex, clamp } from './convert'
import { pickWeighted, rand, shuffle, type Rng } from './random'
import type { Palette, Swatch } from '../../state/types'

export type Harmony = 'analogous' | 'complementary' | 'split' | 'triadic' | 'tetradic' | 'mono'

const HUE_OFFSETS: Record<Harmony, number[]> = {
  analogous: [-30, -15, 0, 15, 30],
  complementary: [0, 180],
  split: [0, 150, 210],
  triadic: [0, 120, 240],
  tetradic: [0, 90, 180, 270],
  mono: [0],
}

const L_MIN = 0.18
const L_MAX = 0.88
const L_MIN_GAP = 0.1
const HUE_JITTER = 6

function pickHarmony(n: number, rng: Rng): Harmony {
  const modes: Harmony[] = ['analogous', 'complementary', 'split', 'triadic', 'mono']
  const weights = [30, 15, 15, 15, 15]
  if (n >= 4) {
    modes.push('tetradic')
    weights.push(10)
  }
  return pickWeighted(modes, weights, rng)
}

/** n lightness values spread across [L_MIN, L_MAX], shuffled so neighbors differ by >= L_MIN_GAP where possible. */
function lightnessLadder(n: number, rng: Rng): number[] {
  const step = n > 1 ? (L_MAX - L_MIN) / (n - 1) : 0
  const base = Array.from({ length: n }, (_, i) => L_MIN + i * step)
  let ladder = shuffle(base, rng)
  for (let attempt = 0; attempt < 5; attempt++) {
    const ok = ladder.every((l, i) => i === 0 || Math.abs(l - ladder[i - 1]) >= L_MIN_GAP - 1e-9)
    if (ok) break
    ladder = shuffle(base, rng)
  }
  return ladder
}

/**
 * Produce a new palette where every unlocked swatch is regenerated using a
 * random color-harmony rule. Locked swatches keep their hex; ids are preserved.
 */
export function generatePalette(current: Palette, rng: Rng = Math.random): Palette {
  const n = current.length
  const harmony = pickHarmony(n, rng)
  const offsets = HUE_OFFSETS[harmony]

  const firstLocked = current.find((s) => s.locked)
  const baseHue = firstLocked ? hexToHsl(firstLocked.hex).h : rand(0, 360, rng)

  const ladder = lightnessLadder(n, rng)
  const monoSat = rand(0.25, 0.55, rng)

  return current.map((swatch, i): Swatch => {
    if (swatch.locked) return swatch
    const h = (((baseHue + offsets[i % offsets.length] + rand(-HUE_JITTER, HUE_JITTER, rng)) % 360) + 360) % 360
    const l = ladder[i]
    let s: number
    if (harmony === 'mono') {
      s = clamp(monoSat + rand(-0.05, 0.05, rng), 0, 1)
    } else {
      s = rand(0.45, 0.85, rng) * (1 - 0.6 * Math.abs(l - 0.5))
    }
    return { ...swatch, hex: hslToHex({ h, s, l }) }
  })
}

/**
 * Intermediate "candidate" colors shown while a column is sequencing: same
 * hue family as the final color but visibly different, so the flicker reads
 * as searching rather than random noise. Never returns the final color itself.
 */
export function candidateColors(finalHex: string, n: number, rng: Rng = Math.random): string[] {
  const base = hexToHsl(finalHex)
  const out: string[] = []
  let guard = 0
  while (out.length < n && guard++ < n * 10) {
    const h = (base.h + rand(-28, 28, rng) + 360) % 360
    const l = clamp(base.l + (rng() < 0.5 ? -1 : 1) * rand(0.14, 0.3, rng), 0.1, 0.92)
    const s = clamp(base.s + rand(-0.25, 0.25, rng), 0.15, 0.95)
    const hex = hslToHex({ h, s, l })
    if (hex !== finalHex && !out.includes(hex)) out.push(hex)
  }
  return out
}

/** A color roughly between two neighbors in HSL space, used when inserting a column. */
export function betweenColors(leftHex: string | undefined, rightHex: string | undefined, rng: Rng = Math.random): string {
  if (leftHex && rightHex) {
    const a = hexToHsl(leftHex)
    const b = hexToHsl(rightHex)
    let dh = b.h - a.h
    if (dh > 180) dh -= 360
    if (dh < -180) dh += 360
    return hslToHex({ h: (a.h + dh / 2 + 360) % 360, s: (a.s + b.s) / 2, l: (a.l + b.l) / 2 })
  }
  const anchor = leftHex ?? rightHex
  if (anchor) {
    const c = hexToHsl(anchor)
    return hslToHex({ h: (c.h + rand(-20, 20, rng) + 360) % 360, s: c.s, l: clamp(c.l + rand(-0.2, 0.2, rng), L_MIN, L_MAX) })
  }
  return hslToHex({ h: rand(0, 360, rng), s: rand(0.45, 0.85, rng), l: rand(L_MIN, L_MAX, rng) })
}
