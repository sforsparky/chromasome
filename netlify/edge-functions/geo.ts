// Adds the visitor's country to the page as <meta name="geo-country">, so the app can show the
// cookie banner only where consent is required. Runs on Netlify's edge (Deno); not part of the Vite build.
import type { Config, Context } from 'https://edge.netlify.com'

export default async (_request: Request, context: Context) => {
  const response = await context.next()
  if (!(response.headers.get('content-type') ?? '').includes('text/html')) return response
  const country = (context.geo?.country?.code ?? '').replace(/[^A-Za-z]/g, '').slice(0, 2)
  const html = (await response.text()).replace('</head>', `<meta name="geo-country" content="${country}" />\n</head>`)
  const headers = new Headers(response.headers)
  headers.delete('content-length')
  // The country differs per visitor, so shared caches must not reuse this page.
  headers.set('cache-control', 'private, no-cache')
  return new Response(html, { status: response.status, headers })
}

export const config: Config = { path: ['/', '/index.html'] }
