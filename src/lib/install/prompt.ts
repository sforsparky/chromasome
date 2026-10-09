/**
 * Chrome and Samsung Internet on Android fire `beforeinstallprompt` once the app can be installed.
 * Keep that event so the banner's Install button can open the browser's own prompt later.
 */
export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((fn) => fn())

/**
 * Start listening. `keepBrowserUi` returns true when the visitor dismissed our banner, so the
 * browser's own install hint is left alone instead of being swapped for a banner that never shows.
 */
export function listenForInstallPrompt(keepBrowserUi: () => boolean) {
  window.addEventListener('beforeinstallprompt', (e) => {
    if (keepBrowserUi()) return
    e.preventDefault()
    deferred = e as InstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    emit()
  })
}

export function subscribeInstallPrompt(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export const getInstallPrompt = () => deferred

/** Open the browser's install prompt. The event works once, so it is spent either way. */
export async function runInstallPrompt(): Promise<boolean> {
  const e = deferred
  if (!e) return false
  deferred = null
  emit()
  await e.prompt()
  const { outcome } = await e.userChoice
  return outcome === 'accepted'
}
