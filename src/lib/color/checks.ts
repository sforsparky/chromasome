import { copy } from '../../copy'
import { deriveRoles, LOUD_C, QUIET_C, type Roles } from './roles'

export type CheckId = 'emphasis' | 'value' | 'space'
export type CheckStatus = 'pass' | 'warn' | 'fail'
export type CheckResult = { id: CheckId; status: CheckStatus; verdict: string }
export type PaletteReport = Roles & { checks: CheckResult[]; passed: number }

/** L* distance that keeps two values apart when squinting. */
const VALUE_GAP = 25
/** L* distance that lets one color anchor a pair that sits close. */
const FAR_GAP = 40
const CLOSE_MIN = 5
/** L* distance between loud and background for the loud color to pop. */
const POP_GAP = 20

function checkEmphasis(hexes: string[], r: Roles): CheckResult {
  const loud = hexes.filter((_, i) => r.roles[i].chroma >= LOUD_C)
  const between = hexes.filter((_, i) => r.roles[i].chroma > QUIET_C && r.roles[i].chroma < LOUD_C)
  const v = copy.verdicts
  if (loud.length >= 2) return { id: 'emphasis', status: 'fail', verdict: v.shouting(loud) }
  if (between.length) return { id: 'emphasis', status: 'warn', verdict: v.halfLoud(between[0]) }
  return { id: 'emphasis', status: 'pass', verdict: loud.length ? v.oneLoud(loud[0]) : v.calm }
}

function checkValue(hexes: string[], r: Roles): CheckResult {
  const v = copy.verdicts
  const trio = [r.background, r.second, r.loud].filter((i) => i >= 0).sort((a, b) => r.roles[a].lstar - r.roles[b].lstar)
  const ls = trio.map((i) => r.roles[i].lstar)
  if (trio.length === 2) {
    return ls[1] - ls[0] >= VALUE_GAP
      ? { id: 'value', status: 'pass', verdict: v.pairApart }
      : { id: 'value', status: 'fail', verdict: v.blur }
  }
  const low = ls[1] - ls[0]
  const high = ls[2] - ls[1]
  if (low >= VALUE_GAP && high >= VALUE_GAP) return { id: 'value', status: 'pass', verdict: v.distinct }
  const [near, far] = low < high ? [low, high] : [high, low]
  if (near >= CLOSE_MIN && far >= FAR_GAP) {
    const apart = low < high ? trio[2] : trio[0]
    return { id: 'value', status: 'pass', verdict: v.anchored(hexes[apart]) }
  }
  if (ls[2] - ls[0] >= FAR_GAP) {
    const [a, b] = low < high ? [trio[0], trio[1]] : [trio[1], trio[2]]
    return { id: 'value', status: 'warn', verdict: v.close(hexes[a], hexes[b]) }
  }
  return { id: 'value', status: 'fail', verdict: v.blur }
}

function checkSpace(hexes: string[], r: Roles): CheckResult {
  const v = copy.verdicts
  const bg = r.roles[r.background]
  const loud = r.roles[r.loud]
  const gap = Math.abs(loud.lstar - bg.lstar)
  const share = Math.round(loud.weight * 100)
  if (r.calm) {
    return gap >= FAR_GAP
      ? { id: 'space', status: 'pass', verdict: v.accentApart(hexes[r.loud], share) }
      : { id: 'space', status: 'fail', verdict: v.accentBlends(hexes[r.loud], hexes[r.background]) }
  }
  if (bg.chroma > QUIET_C) return { id: 'space', status: 'fail', verdict: v.busyBackground(hexes[r.background]) }
  if (gap < POP_GAP) return { id: 'space', status: 'fail', verdict: v.noPop(hexes[r.loud], hexes[r.background]) }
  return { id: 'space', status: 'pass', verdict: v.pops(hexes[r.loud], share) }
}

/** Roles plus the three lesson checks, from the hexes alone. */
export function evaluatePalette(hexes: string[]): PaletteReport {
  const roles = deriveRoles(hexes)
  const checks = [checkEmphasis(hexes, roles), checkValue(hexes, roles), checkSpace(hexes, roles)]
  return { ...roles, checks, passed: checks.filter((c) => c.status === 'pass').length }
}
