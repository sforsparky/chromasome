import { useState, useSyncExternalStore } from 'react'
import { copy } from '../copy'
import { iosInstallHint, isStandalone } from '../lib/install/platform'
import { getInstallPrompt, listenForInstallPrompt, runInstallPrompt, subscribeInstallPrompt } from '../lib/install/prompt'
import { usePalette } from '../state/PaletteProvider'
import { useStacked } from '../state/useStacked'
import { BrandMark, CloseIcon, ShareIcon } from './Icons'

/** ✕ hides the banner for good on this device. Storage can be unavailable (private mode). */
const DISMISSED_KEY = 'chromasome.installDismissed'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

function writeDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    /* not remembered; the banner still goes away for this visit */
  }
}

// Android fires its install event early, often before the first render, so listen from load.
if (typeof window !== 'undefined') listenForInstallPrompt(readDismissed)

/**
 * Phones only: invites the visitor to put Chromasome on their Home Screen once they have changed the palette.
 * Android gets an Install button; iOS gets the Share sheet steps, since pages cannot install there.
 */
export function InstallBanner({ hidden }: { hidden: boolean }) {
  const { palette } = usePalette()
  const stacked = useStacked()
  const androidPrompt = useSyncExternalStore(subscribeInstallPrompt, getInstallPrompt, () => null)
  const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  const [ios] = useState(() => (isStandalone() ? null : iosInstallHint(navigator.userAgent, navigator.maxTouchPoints)))
  const [dismissed, setDismissed] = useState(readDismissed)

  // Wait until the palette has changed once, so the invite follows a first try instead of greeting a new visitor.
  const colors = palette.map((s) => s.hex).join()
  const [firstColors] = useState(colors)
  const [engaged, setEngaged] = useState(false)
  if (!engaged && colors !== firstColors) setEngaged(true)

  if (hidden || dismissed || !engaged || !stacked || !touch || (!androidPrompt && !ios)) return null

  const dismiss = () => {
    setDismissed(true)
    writeDismissed()
  }

  return (
    <aside className="install" aria-label={copy.installLabel}>
      <BrandMark className="install__mark" />
      <div className="install__text">
        <strong className="install__title">{androidPrompt ? copy.installTitle : copy.installTitleIos}</strong>
        <span className="install__hint">
          {androidPrompt ? (
            copy.installHintAndroid
          ) : (
            <>
              {copy.installTap} {ios === 'menu' && <>•••, {copy.installThen} </>}
              <ShareIcon className="install__share" width={14} height={14} /> {copy.installShare}, {copy.installThen} {copy.installAddToHome}.
            </>
          )}
        </span>
      </div>
      {androidPrompt && (
        <button type="button" className="btn btn--primary install__go" onClick={() => void runInstallPrompt()}>
          {copy.install}
        </button>
      )}
      <button type="button" className="btn btn--icon btn--ghost install__close" onClick={dismiss} aria-label={copy.installDismiss} title={copy.installDismiss}>
        <CloseIcon />
      </button>
    </aside>
  )
}
