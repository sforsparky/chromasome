import { betweenColors, generatePalette } from '../lib/color/generate'
import { normalizeHex } from '../lib/color/convert'
import { DEFAULT_COLORS, HISTORY_LIMIT, MAX_COLORS, MIN_COLORS, makeSwatch, type Palette } from './types'

export type State = {
  past: Palette[]
  present: Palette
  future: Palette[]
}

export type Action =
  | { type: 'MUTATE' }
  | { type: 'TOGGLE_LOCK'; id: string }
  | { type: 'ADD'; index: number; hex?: string }
  | { type: 'REMOVE'; id: string }
  | { type: 'MOVE'; from: number; to: number }
  | { type: 'BEGIN_EDIT' }
  | { type: 'SET_HEX'; id: string; hex: string }
  | { type: 'LOAD'; hexes: string[] }
  | { type: 'UNDO' }
  | { type: 'REDO' }

/** Record `present` in history and move to `next`. */
function commit(state: State, next: Palette): State {
  const past = [...state.past, state.present]
  if (past.length > HISTORY_LIMIT) past.splice(0, past.length - HISTORY_LIMIT)
  return { past, present: next, future: [] }
}

export function initState(hexes?: string[] | null): State {
  const seed = hexes && hexes.length >= MIN_COLORS && hexes.length <= MAX_COLORS ? hexes : null
  const present = seed
    ? seed.map((h) => makeSwatch(normalizeHex(h)))
    : generatePalette(Array.from({ length: DEFAULT_COLORS }, () => makeSwatch('#000000')))
  return { past: [], present, future: [] }
}

export function reducer(state: State, action: Action): State {
  const { present } = state
  switch (action.type) {
    case 'MUTATE':
      return commit(state, generatePalette(present))

    case 'TOGGLE_LOCK':
      return {
        ...state,
        present: present.map((s) => (s.id === action.id ? { ...s, locked: !s.locked } : s)),
      }

    case 'ADD': {
      if (present.length >= MAX_COLORS) return state
      const index = Math.max(0, Math.min(action.index, present.length))
      const hex = action.hex ? normalizeHex(action.hex) : betweenColors(present[index - 1]?.hex, present[index]?.hex)
      const next = present.slice()
      next.splice(index, 0, makeSwatch(hex))
      return commit(state, next)
    }

    case 'REMOVE': {
      if (present.length <= MIN_COLORS) return state
      const next = present.filter((s) => s.id !== action.id)
      if (next.length === present.length) return state
      return commit(state, next)
    }

    case 'MOVE': {
      const { from, to } = action
      if (from === to || from < 0 || to < 0 || from >= present.length || to >= present.length) return state
      const next = present.slice()
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return commit(state, next)
    }

    case 'BEGIN_EDIT':
      return commit(state, present)

    case 'SET_HEX': {
      const hex = normalizeHex(action.hex)
      if (!present.some((s) => s.id === action.id && s.hex !== hex)) return state
      return { ...state, present: present.map((s) => (s.id === action.id ? { ...s, hex } : s)) }
    }

    case 'LOAD': {
      const hexes = action.hexes
      if (hexes.length < MIN_COLORS || hexes.length > MAX_COLORS) return state
      return commit(
        state,
        hexes.map((h) => makeSwatch(normalizeHex(h))),
      )
    }

    case 'UNDO': {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      return { past: state.past.slice(0, -1), present: previous, future: [present, ...state.future] }
    }

    case 'REDO': {
      if (state.future.length === 0) return state
      const [next, ...rest] = state.future
      return { past: [...state.past, present], present: next, future: rest }
    }
  }
}
