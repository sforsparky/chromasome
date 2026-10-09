import { hexToOklch, lstar } from './oklch'

/** OKLCH chroma at or above which a color reads as loud, and at or below which it reads as quiet. */
export const LOUD_C = 0.12
export const QUIET_C = 0.07

/** `accent` is the loud slot in a calm palette: it stands out by value, not color. */
export type Role = 'background' | 'second' | 'loud' | 'accent' | 'extra'

export type ColorMetrics = { lstar: number; chroma: number; hue: number }

export type RoleInfo = ColorMetrics & { role: Role; weight: number }

/** Roles in input order. `loud` is the index of the loud or accent color, -1 if there is none. */
export type Roles = { roles: RoleInfo[]; calm: boolean; background: number; second: number; loud: number }

const BG_CHROMA_PENALTY = 150

export function measure(hex: string): ColorMetrics {
  const { c, h } = hexToOklch(hex)
  return { lstar: lstar(hex), chroma: c, hue: h }
}

function argmax(indices: number[], score: (i: number) => number): number {
  let best = -1
  for (const i of indices) if (best < 0 || score(i) > score(best)) best = i
  return best
}

/** 60/30/10 at three colors; extras share the 30 side; the loud color always gets the smallest share. */
function weightFor(role: Role, n: number): number {
  if (n === 2) return role === 'background' ? 0.75 : 0.25
  const u = 0.4 / (4 + 1.25 * (n - 3))
  if (role === 'background') return 0.6
  if (role === 'second') return 3 * u
  if (role === 'extra') return 1.25 * u
  return u
}

/** Work out who plays background, second and loud from the colors alone (no stored state). */
export function deriveRoles(hexes: string[]): Roles {
  const m = hexes.map(measure)
  const all = m.map((_, i) => i)
  const loudest = argmax(all, (i) => m[i].chroma)
  const calm = m[loudest].chroma < LOUD_C
  const bgScore = (i: number) => Math.abs(m[i].lstar - 50) - BG_CHROMA_PENALTY * m[i].chroma
  const farFrom = (j: number) => (i: number) => Math.abs(m[i].lstar - m[j].lstar)

  let background: number
  let loud: number
  if (calm) {
    background = argmax(all, bgScore)
    loud = argmax(all.filter((i) => i !== background), farFrom(background))
  } else {
    loud = loudest
    background = argmax(all.filter((i) => i !== loud), bgScore)
  }
  const second = argmax(all.filter((i) => i !== loud && i !== background), farFrom(background))

  const roles = m.map((metrics, i): RoleInfo => {
    const role: Role =
      i === background ? 'background' : i === loud ? (calm ? 'accent' : 'loud') : i === second ? 'second' : 'extra'
    return { ...metrics, role, weight: weightFor(role, hexes.length) }
  })
  return { roles, calm, background, second, loud }
}
