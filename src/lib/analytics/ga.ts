/** Google Analytics 4, shared with inmydna.com. Loaded only on the live site and only once allowed. */
export const GA_ID = 'G-G8XSXDNG51'
export const LIVE_HOST = 'chromasome.inmydna.com'

type Params = Record<string, string | number | boolean>

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

let loaded = false
let granted = false

// gtag.js reads `arguments` objects off the data layer, not plain arrays.
function gtag(..._args: unknown[]) {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer!.push(arguments)
}

export function startAnalytics() {
  granted = true
  if (loaded) {
    gtag('consent', 'update', { analytics_storage: 'granted' })
    return
  }
  loaded = true
  window.dataLayer = window.dataLayer || []
  // Analytics only: nothing here is used for ads.
  gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
  gtag('js', new Date())
  gtag('config', GA_ID)
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.append(script)
}

/** Withdraws consent: stops collection and removes the GA cookies from this site and inmydna.com. */
export function stopAnalytics() {
  granted = false
  if (loaded) gtag('consent', 'update', { analytics_storage: 'denied' })
  const names = document.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter((n) => n === '_ga' || n.startsWith('_ga_'))
  const parent = '.' + location.hostname.split('.').slice(-2).join('.')
  for (const name of names) {
    for (const domain of ['', `; domain=${location.hostname}`, `; domain=${parent}`]) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain}`
    }
  }
}

/** Sends a GA4 event when analytics is running; otherwise does nothing. */
export function track(name: string, params: Params = {}) {
  if (loaded && granted) gtag('event', name, params)
}
