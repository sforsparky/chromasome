import { copy } from '../copy'
import { usePalette } from '../state/PaletteProvider'
import { MAX_COLORS } from '../state/types'
import { PlusIcon } from './Icons'

export function ColumnInserter({ index }: { index: number }) {
  const { palette, dispatch } = usePalette()
  if (palette.length >= MAX_COLORS) return null
  return (
    <div className="inserter">
      <button type="button" className="inserter__btn" onClick={() => dispatch({ type: 'ADD', index })} aria-label={copy.add} title={copy.add}>
        <PlusIcon />
      </button>
    </div>
  )
}
