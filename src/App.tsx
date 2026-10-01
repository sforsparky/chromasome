import { useCallback, useState } from 'react'
import { ExportDialog } from './components/ExportDialog'
import { ExtractDialog } from './components/ExtractDialog'
import { Header } from './components/Header'
import { PaletteBoard } from './components/PaletteBoard'
import { ToastProvider } from './components/Toast'
import { Toolbar } from './components/Toolbar'
import { decodeHash } from './lib/url/codec'
import { PaletteProvider } from './state/PaletteProvider'
import { useKeyboard } from './state/useKeyboard'
import { useUrlSync } from './state/useUrlSync'

function Shell() {
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [extractOpen, setExtractOpen] = useState(false)

  useUrlSync()
  useKeyboard(useCallback(() => setAdjustingId(null), []))

  return (
    <div className="app">
      <Header />
      <PaletteBoard adjustingId={adjustingId} onAdjust={setAdjustingId} />
      <Toolbar onExport={() => setExportOpen(true)} onExtract={() => setExtractOpen(true)} />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
      <ExtractDialog open={extractOpen} onClose={() => setExtractOpen(false)} />
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
