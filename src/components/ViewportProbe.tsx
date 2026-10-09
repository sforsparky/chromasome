import { useEffect, useState } from 'react'
import './ViewportProbe.css'

/**
 * Deploy previews only (VITE_VIEWPORT_PROBE): a readout of the viewport sizes iOS reports, to fit the
 * home-screen web app to real devices. Production builds never load this file.
 */

const UNITS = ['100vh', '100svh', '100dvh', '100lvh', '100%'] as const
const INSETS = ['top', 'right', 'bottom', 'left'] as const

function measure(): [string, string][] {
  const probe = (style: string) => {
    const el = document.createElement('div')
    el.style.cssText = `position:fixed;left:0;top:0;width:1px;visibility:hidden;pointer-events:none;${style}`
    document.body.append(el)
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    el.remove()
    return { h: Math.round(r.height), cs }
  }
  const heights = UNITS.map((u) => `${u}=${probe(`height:${u}`).h}`).join(' ')
  const { cs } = probe(INSETS.map((side) => `padding-${side}:env(safe-area-inset-${side})`).join(';'))
  const insets = INSETS.map((side) => parseFloat(cs.getPropertyValue(`padding-${side}`)) || 0).join('/')
  const box = (sel: string) => {
    const el = document.querySelector(sel)
    if (!el) return '–'
    const r = el.getBoundingClientRect()
    return `${Math.round(r.top)}→${Math.round(r.bottom)}`
  }
  return [
    ['screen', `${screen.width}×${screen.height} @${devicePixelRatio}x`],
    ['innerHeight', String(innerHeight)],
    ['visualViewport', String(Math.round(visualViewport?.height ?? 0))],
    ['clientHeight', String(document.documentElement.clientHeight)],
    ['units', heights],
    ['safe t/r/b/l', insets],
    ['header', box('.header')],
    ['toolbar', box('.toolbar')],
    ['standalone', `${matchMedia('(display-mode: standalone)').matches} / ${String((navigator as Navigator & { standalone?: boolean }).standalone)}`],
    ['ua', navigator.userAgent.replace(/^Mozilla\/5\.0 /, '')],
  ]
}

export default function ViewportProbe() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<[string, string][]>([])

  useEffect(() => {
    if (!open) return
    const update = () => setRows(measure())
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [open])

  return (
    <div className="probe">
      <button type="button" className="probe__toggle" onClick={() => setOpen(!open)}>
        {open ? 'Close' : 'Viewport'}
      </button>
      {open && (
        <dl className="probe__rows">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
