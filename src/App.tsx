import { useCallback, useMemo, useRef, useState } from 'react'
import { ChecksPanel } from './components/ChecksPanel'
import { ConsentBanner } from './components/ConsentBanner'
import { ExportDialog } from './components/ExportDialog'
import { ExtractDialog } from './components/ExtractDialog'
import { Header } from './components/Header'
import { InstallBanner } from './components/InstallBanner'
import { PaletteBoard } from './components/PaletteBoard'
import { ToastProvider } from './components/Toast'
import { Toolbar } from './components/Toolbar'
import { track } from './lib/analytics/ga'
import { evaluatePalette } from './lib/color/checks'
import { decodeHash } from './lib/url/codec'
import { PaletteProvider, usePalette } from './state/PaletteProvider'
import { useAnalytics } from './state/useAnalytics'
import { useKeyboard } from './state/useKeyboard'
import { useUrlSync } from './state/useUrlSync'

/** Phones: "Don't show again" on the checks sheet, remembered per device. Storage can be unavailable (private mode). */
const QUIET_CHECKS_KEY = 'chromasome.quietChecks'

function readQuietChecks(): boolean {
  try {
    return localStorage.getItem(QUIET_CHECKS_KEY) === '1'
  } catch {
    return false
  }
}

function writeQuietChecks(quiet: boolean) {
  try {
    if (quiet) localStorage.setItem(QUIET_CHECKS_KEY, '1')
    else localStorage.removeItem(QUIET_CHECKS_KEY)
  } catch {
    /* not remembered; the choice still applies for this visit */
  }
}

function Shell() {
  const { palette } = usePalette()
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [extractOpen, setExtractOpen] = useState(false)
  const [checksOpen, setChecksOpen] = useState(false)
  const [squint, setSquint] = useState(false)
  const [proportional, setProportional] = useState(false)
  const [quietChecks, setQuietChecks] = useState(readQuietChecks)
  const changeQuietChecks = useCallback((quiet: boolean) => {
    setQuietChecks(quiet)
    writeQuietChecks(quiet)
  }, [])
  const checksButton = useRef<HTMLButtonElement>(null)
  const analytics = useAnalytics()

  const changeSquint = useCallback((on: boolean) => {
    setSquint(on)
    if (on) track('squint_on')
  }, [])
  const changeProportional = useCallback((on: boolean) => {
    setProportional(on)
    if (on) track('size_by_role_on')
  }, [])

  // Closing the panel removes the focused element, so hand focus back to the button that opened it.
  const closeChecks = useCallback(() => {
    const hadFocus = document.activeElement?.closest('#checks-panel') != null
    setChecksOpen(false)
    if (hadFocus) checksButton.current?.focus()
  }, [])

  const hexes = useMemo(() => palette.map((s) => s.hex), [palette])
  const report = useMemo(() => evaluatePalette(hexes), [hexes])

  useUrlSync()
  // Escape closes the innermost thing first: the adjust panel, then the checks panel.
  useKeyboard(useCallback(() => (adjustingId ? setAdjustingId(null) : closeChecks()), [adjustingId, closeChecks]))

  return (
    <div className="app">
      <Header onCookieSettings={analytics.openSettings} />
      <PaletteBoard
        adjustingId={adjustingId}
        onAdjust={setAdjustingId}
        report={report}
        squint={squint}
        proportional={proportional}
        showRoles={checksOpen || proportional}
      />
      <InstallBanner hidden={checksOpen || analytics.showBanner} />
      <Toolbar
        onExport={() => setExportOpen(true)}
        onExtract={() => setExtractOpen(true)}
        squint={squint}
        onSquint={changeSquint}
        proportional={proportional}
        onProportional={changeProportional}
        checksOpen={checksOpen}
        onChecks={setChecksOpen}
        checksButtonRef={checksButton}
        autoChecks={!quietChecks}
        onCookieSettings={analytics.openSettings}
        checksPopover={checksOpen && <ChecksPanel report={report} hexes={hexes} onClose={closeChecks} quiet={quietChecks} onQuiet={changeQuietChecks} />}
      />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} proportional={proportional} />
      <ExtractDialog open={extractOpen} onClose={() => setExtractOpen(false)} />
      {analytics.showBanner && <ConsentBanner onDecide={analytics.decide} />}
    </div>
  )
}

export default function App() {
  return (
    <PaletteProvider initialHexes={decodeHash(window.location.hash)}>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </PaletteProvider>
  )
}
