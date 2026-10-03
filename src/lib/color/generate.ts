import { hexToHsl, hslToHex, clamp } from './convert'
import { lstar, lstarToOkL, maxChroma, oklchToHex } from './oklch'
import { pickWeighted, rand, shuffle, type Rng } from './random'
import { LOUD_C, measure } from './roles'
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
const HUE_JITTER = 6

/** Chance that a Mutate with no locked loud color comes out calm (no loud color, one clearly darker). */
const CALM_P = 1 / 6
/** Minimum L* distance between the loud color and the quiet colors around it. */
const GAP = 27
const LOUD_C_RANGE: Range = [0.16, 0.24]
const LOUD_LSTAR: Range = [30, 86]
const LOUD_START: Range = [50, 66]
const HUE_ROTATE = 25
const PICK_TRIES = 10
const LIGHT_BG_P = 0.75

type Range = [number, number]
type Spec = { lstar: Range; chroma: Range }
type Planned = { lstar: number; chroma: number; hue: number }

function pickHarmony(n: number, rng: Rng): Harmony {
  const modes: Harmony[] = ['analogous', 'complementary', 'split', 'triadic', 'mono']
  const weights = [30, 15, 15, 15, 15]
  if (n >= 4) {
    modes.push('tetradic')
    weights.push(10)
  }
  return pickWeighted(modes, weights, rng)
}

const wrapHue = (h: number) => ((h % 360) + 360) % 360
const minDistance = (l: number, placed: number[]) => Math.min(Infinity, ...placed.map((p) => Math.abs(l - p)))

/** A random L* in range, keeping the best of a few tries away from colors already placed. */
function pickLstar([lo, hi]: Range, placed: number[], rng: Rng): number {
  let best = rand(lo, hi, rng)
  for (let i = 1; i < PICK_TRIES; i++) {
    const l = rand(lo, hi, rng)
    if (minDistance(l, placed) > minDistance(best, placed)) best = l
  }
  return best
}

/** Build a hex at a target L*, nudging OKLCH lightness so the result lands on it. */
function makeColor({ lstar: target, chroma, hue }: Planned): string {
  let l = lstarToOkL(target)
  let hex = oklchToHex({ l, c: chroma, h: hue })
  for (let i = 0; i < 2; i++) {
    l += (target - lstar(hex)) / 116
    hex = oklchToHex({ l, c: chroma, h: hue })
  }
  return hex
}

/** Place the loud color: in a mid-light band, far from locked values, at a hue that can carry the chroma. */
function planLoud(startHue: number, placed: number[], rng: Rng): Planned {
  const start = rand(LOUD_START[0], LOUD_START[1], rng)
  let hue = startHue
  let lstarPick = -1
  for (let turn = 0; turn < 5 && lstarPick < 0; turn++) {
    if (turn > 0) hue = wrapHue(hue + HUE_ROTATE)
    let bestDist = Infinity
    for (let l = LOUD_LSTAR[0]; l <= LOUD_LSTAR[1]; l += 2) {
      if (maxChroma(lstarToOkL(l), hue) < LOUD_C_RANGE[0] || minDistance(l, placed) < GAP) continue
      if (Math.abs(l - start) < bestDist) {
        bestDist = Math.abs(l - start)
        lstarPick = l
      }
    }
  }
  if (lstarPick < 0) {
    hue = startHue
    lstarPick = LOUD_LSTAR[0]
    for (let l = LOUD_LSTAR[0]; l <= LOUD_LSTAR[1]; l += 2) {
      if (minDistance(l, placed) > minDistance(lstarPick, placed)) lstarPick = l
    }
  }
  const cap = Math.min(LOUD_C_RANGE[1], maxChroma(lstarToOkL(lstarPick), hue))
  return { lstar: lstarPick, chroma: rand(Math.min(LOUD_C_RANGE[0], cap), cap, rng), hue }
}

const span = (lo: number, hi: number): Range => [lo, Math.max(lo, hi)]

/** Background and second around a loud color at L* `loud`: one far above it, one far below where there is room. */
function quietSpecs(loud: number, lockedQuiet: number[], rng: Rng): Spec[] {
  const canAbove = loud + GAP <= 97
  const canBelow = loud - GAP >= 14
  const lightBg: Spec = { lstar: span(Math.max(90, loud + GAP), 97), chroma: [0.005, 0.03] }
  const darkBg: Spec = { lstar: [6, 14], chroma: [0.01, 0.04] }
  // Only one side has room: both quiet colors go there, the second between background and loud.
  if (!canAbove) return [darkBg, { lstar: span(10 + GAP, loud - GAP), chroma: [0.02, 0.06] }]
  if (!canBelow) return [lightBg, { lstar: span(loud + GAP, 90 - GAP), chroma: [0.02, 0.06] }]

  const lockedAbove = lockedQuiet.some((l) => l > loud)
  const lockedBelow = lockedQuiet.some((l) => l < loud)
  const bgLight = lockedAbove !== lockedBelow ? lockedBelow : rng() < LIGHT_BG_P
  const darkSecond: Spec = { lstar: span(14, Math.min(30, loud - GAP)), chroma: [0.03, 0.065] }
  const lightSecond: Spec = { lstar: span(Math.max(78, loud + GAP), 92), chroma: [0.015, 0.045] }
  return bgLight ? [lightBg, darkSecond] : [darkBg, lightSecond]
}

const CALM_SPECS: Spec[] = [
  { lstar: [18, 30], chroma: [0.03, 0.06] }, // accent: clearly darker
  { lstar: [88, 96], chroma: [0.01, 0.035] }, // background
  { lstar: [70, 84], chroma: [0.02, 0.05] }, // second
]

/**
 * Produce a new palette where every unlocked swatch is regenerated: one loud color, the rest quiet and
 * spread across dark, middle and light (or, now and then, a calm palette). Hues follow a random
 * harmony rule. Locked swatches keep their hex and steer the rest; ids are preserved.
 */
export function generatePalette(current: Palette, rng: Rng = Math.random): Palette {
  const n = current.length
  const harmony = pickHarmony(n, rng)
  const offsets = HUE_OFFSETS[harmony]
  const free = current.filter((s) => !s.locked).length
  const calmRoll = rng()
  if (free === 0) return current

  const locked = current.filter((s) => s.locked).map((s) => measure(s.hex))
  const lockedLoud = locked.find((m) => m.chroma >= LOUD_C)
  const lockedQuiet = locked.filter((m) => m !== lockedLoud).map((m) => m.lstar)
  const tinted = locked.find((m) => m.chroma >= 0.03)
  const anchor = lockedLoud ?? tinted
  const baseHue = anchor ? anchor.hue : rand(0, 360, rng)
  const calm = !lockedLoud && calmRoll < CALM_P

  let slot = anchor && !lockedLoud ? 1 : 0
  const nextHue = () => wrapHue(baseHue + offsets[slot++ % offsets.length] + rand(-HUE_JITTER, HUE_JITTER, rng))
  const placed = locked.map((m) => m.lstar)
  const planned: Planned[] = []
  const add = (spec: Spec) => {
    const l = pickLstar(spec.lstar, placed, rng)
    placed.push(l)
    planned.push({ lstar: l, chroma: rand(spec.chroma[0], spec.chroma[1], rng), hue: nextHue() })
  }
  // A locked quiet color already covering a spec's band stands in for it.
  const covered = (spec: Spec) => lockedQuiet.some((l) => l >= spec.lstar[0] - 10 && l <= spec.lstar[1] + 10)

  if (calm) {
    CALM_SPECS.filter((spec) => !covered(spec)).forEach(add)
  } else {
    let loudL = lockedLoud?.lstar
    if (loudL === undefined) {
      const loud = planLoud(nextHue(), placed, rng)
      planned.push(loud)
      placed.push(loud.lstar)
      loudL = loud.lstar
    }
    quietSpecs(loudL, lockedQuiet, rng).filter((spec) => !covered(spec)).forEach(add)
  }

  // Extras stay quiet and sit inside the range already used, so the background stays the most extreme.
  while (planned.length < free) {
    const lo = Math.min(...placed)
    const hi = Math.max(...placed)
    add({ lstar: hi - lo > 8 ? [lo + 4, hi - 4] : [20, 85], chroma: [0.01, 0.06] })
  }

  const hexes = shuffle(planned.slice(0, free).map(makeColor), rng)
  let next = 0
  return current.map((swatch): Swatch => (swatch.locked ? swatch : { ...swatch, hex: hexes[next++] }))
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
