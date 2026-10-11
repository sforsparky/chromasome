import { useCallback, useEffect, useState } from 'react'
import { LIVE_HOST, startAnalytics, stopAnalytics } from '../lib/analytics/ga'
import { needsConsent } from '../lib/analytics/region'

type Choice = 'granted' | 'denied'

/** The visitor's cookie choice, remembered per device. Storage can be unavailable (private mode). */
const CONSENT_KEY = 'chromasome.analyticsConsent'

function readChoice(): Choice | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

function writeChoice(choice: Choice) {
  try {
    localStorage.setItem(CONSENT_KEY, choice)
  } catch {
    /* not remembered; the choice still applies for this visit */
  }
}

function detectNeedsConsent(): boolean {
  const country = document.querySelector('meta[name="geo-country"]')?.getAttribute('content')
  return needsConsent(country, Intl.DateTimeFormat().resolvedOptions().timeZone)
}

/**
 * Google Analytics on the live site. Where consent is required (EEA, UK, Switzerland) it waits for
 * Accept and offers a way to change the answer; everywhere else it starts straight away.
 */
export function useAnalytics() {
  const [live] = useState(() => location.hostname === LIVE_HOST)
  const [askFirst] = useState(detectNeedsConsent)
  const [choice, setChoice] = useState<Choice | null>(readChoice)
  const [reopened, setReopened] = useState(false)

  useEffect(() => {
    if (!live) return
    if (!askFirst || choice === 'granted') startAnalytics()
    else if (choice === 'denied') stopAnalytics()
  }, [live, askFirst, choice])

  const decide = useCallback((next: Choice) => {
    writeChoice(next)
    setChoice(next)
    setReopened(false)
  }, [])

  const canChange = live && askFirst
  return {
    showBanner: canChange && (choice === null || reopened),
    /** Reopens the banner; only offered where consent applies. */
    openSettings: canChange ? () => setReopened(true) : undefined,
    decide,
  }
}
