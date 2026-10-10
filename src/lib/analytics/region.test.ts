import { describe, expect, it } from 'vitest'
import { needsConsent } from './region'

describe('needsConsent', () => {
  it('asks in the EU, the rest of the EEA, the UK and Switzerland', () => {
    for (const c of ['DE', 'FR', 'IE', 'NO', 'IS', 'GB', 'CH']) expect(needsConsent(c, 'America/New_York')).toBe(true)
  })

  it('does not ask elsewhere, whatever the time zone', () => {
    for (const c of ['US', 'CA', 'JP', 'AU', 'BR']) expect(needsConsent(c, 'Europe/Berlin')).toBe(false)
  })

  it('accepts lower-case codes', () => {
    expect(needsConsent('de', undefined)).toBe(true)
  })

  it('falls back to the time zone when the country is unknown', () => {
    expect(needsConsent(undefined, 'Europe/Paris')).toBe(true)
    expect(needsConsent('', 'Atlantic/Reykjavik')).toBe(true)
    expect(needsConsent(null, 'Pacific/Honolulu')).toBe(false)
    expect(needsConsent('XYZ', 'America/Chicago')).toBe(false)
    expect(needsConsent(undefined, undefined)).toBe(false)
  })
})
