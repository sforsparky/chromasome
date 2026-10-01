export type Swatch = {
  id: string
  hex: string // always normalized "#rrggbb" lowercase
  locked: boolean
}

export type Palette = Swatch[]

export const MIN_COLORS = 2
export const MAX_COLORS = 10
export const DEFAULT_COLORS = 5
export const HISTORY_LIMIT = 100

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function makeSwatch(hex: string, locked = false): Swatch {
  return { id: newId(), hex, locked }
}
