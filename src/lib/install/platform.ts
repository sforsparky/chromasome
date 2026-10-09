/**
 * How a phone visitor can add Chromasome to their Home Screen.
 * iOS has no install prompt a page can trigger, so there we can only explain the Share sheet steps.
 * Android installs go through the browser's own prompt (see prompt.ts), so they need no detection here.
 */
export type IosHint = 'share' | 'menu'

/** In-app browsers (Instagram, Facebook, TikTok…) have no Add to Home Screen. */
const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|Line\/|Twitter|Snapchat|Pinterest|TikTok|musical_ly|BytedanceWebview|GSA\//

/** Other iOS browsers keep their own Share button; only Safari 26 tucks it behind •••. */
const NOT_SAFARI = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|Brave/

/** 'menu' when Share sits behind ••• (Safari 26 and later), 'share' for other iOS browsers, null when it does not apply. */
export function iosInstallHint(ua: string, maxTouchPoints: number): IosHint | null {
  // iPadOS reports a Mac user agent; touch support gives it away.
  const ios = /iPhone|iPod|iPad/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1)
  if (!ios || IN_APP.test(ua)) return null
  const safariVersion = NOT_SAFARI.test(ua) ? null : /Version\/(\d+)/.exec(ua)
  return safariVersion && Number(safariVersion[1]) >= 26 ? 'menu' : 'share'
}

/** Already running from the Home Screen. */
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}
