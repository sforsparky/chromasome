import { useEffect } from 'react'
import { decodeHash, encodeHash, hexesOf, sameHexes } from '../lib/url/codec'
import { usePalette } from './PaletteProvider'

/** Keep the URL hash and the palette in sync, in both directions. */
export function useUrlSync() {
  const { palette, dispatch } = usePalette()

  // Palette -> URL. replaceState keeps browser Back clean; in-app undo covers history.
  useEffect(() => {
    const hash = encodeHash(palette)
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash)
    }
  }, [palette])

  // URL -> palette (user pastes a link or edits the hash by hand).
  useEffect(() => {
    const onHashChange = () => {
      const hexes = decodeHash(window.location.hash)
      if (hexes && !sameHexes(hexes, hexesOf(palette))) {
        dispatch({ type: 'LOAD', hexes })
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [palette, dispatch])
}
