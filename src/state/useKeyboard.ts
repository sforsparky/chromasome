import { useEffect } from 'react'
import { usePalette } from './PaletteProvider'

const NON_TEXT_INPUTS = new Set(['range', 'color', 'checkbox', 'radio', 'button', 'file', 'submit'])

/** True when the key event would be typing into a text field (so we must not hijack it). */
function isTextTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag === 'INPUT') return !NON_TEXT_INPUTS.has((target as HTMLInputElement).type)
  return false
}

/** Space = Mutate, Ctrl/Cmd+Z = Undo, Ctrl/Cmd+Shift+Z or Ctrl+Y = Redo, Escape = onEscape. */
export function useKeyboard(onEscape?: () => void) {
  const { dispatch } = usePalette()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Native <dialog> handles its own Escape; nothing else should fire behind it.
      if (document.querySelector('dialog[open]')) return

      if (e.key === 'Escape') {
        onEscape?.()
        return
      }
      if (isTextTarget(e.target)) return

      const mod = e.ctrlKey || e.metaKey
      if (e.code === 'Space' && !mod) {
        e.preventDefault()
        dispatch({ type: 'MUTATE' })
        return
      }
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        dispatch({ type: e.shiftKey ? 'REDO' : 'UNDO' })
        return
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        dispatch({ type: 'REDO' })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch, onEscape])
}
