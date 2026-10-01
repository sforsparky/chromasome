import { normalizeHex } from '../color/convert'
import { MAX_COLORS, MIN_COLORS, type Palette } from '../../state/types'

const HEX6 = /^[0-9a-f]{6}$/i

/** "#/264653-2a9d8f-e9c46a" */
export function encodeHash(palette: Palette): string {
  return '#/' + palette.map((s) => s.hex.slice(1)).join('-')
}

/** Returns normalized hexes, or null when the hash is not a valid strand. */
export function decodeHash(hash: string): string[] | null {
  let body = hash.trim()
  if (body.startsWith('#')) body = body.slice(1)
  if (body.startsWith('/')) body = body.slice(1)
  if (!body) return null
  const parts = body.split('-')
  if (parts.length < MIN_COLORS || parts.length > MAX_COLORS) return null
  if (!parts.every((p) => HEX6.test(p))) return null
  return parts.map((p) => normalizeHex(p))
}

export function hexesOf(palette: Palette): string[] {
  return palette.map((s) => s.hex)
}

export function sameHexes(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((h, i) => h === b[i])
}
