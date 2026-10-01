import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import { initState, reducer, type Action, type State } from './reducer'
import type { Palette } from './types'

type PaletteContextValue = {
  state: State
  palette: Palette
  dispatch: Dispatch<Action>
  canUndo: boolean
  canRedo: boolean
}

const PaletteContext = createContext<PaletteContextValue | null>(null)

export function PaletteProvider({ initialHexes, children }: { initialHexes: string[] | null; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialHexes, initState)
  const value = useMemo<PaletteContextValue>(
    () => ({
      state,
      palette: state.present,
      dispatch,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
    }),
    [state],
  )
  return <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
}

export function usePalette(): PaletteContextValue {
  const ctx = useContext(PaletteContext)
  if (!ctx) throw new Error('usePalette must be used inside PaletteProvider')
  return ctx
}
