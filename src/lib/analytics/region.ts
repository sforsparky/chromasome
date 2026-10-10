/**
 * Where analytics cookies need opt-in consent before they are set: the EEA (GDPR and the ePrivacy
 * rules), the UK and Switzerland. Everywhere else Google Analytics loads without a banner.
 */
export const CONSENT_COUNTRIES = new Set([
  // EU
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // Rest of the EEA, the UK and Switzerland
  'IS', 'LI', 'NO', 'GB', 'CH',
])

/** Used only when the country is unknown. It errs toward asking: any European time zone counts. */
const CONSENT_TIME_ZONES = /^(Europe\/|Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe)$)/

/** `country` is an ISO 3166 code from the edge (may be missing locally); `timeZone` is the browser's. */
export function needsConsent(country: string | null | undefined, timeZone: string | undefined): boolean {
  const code = (country ?? '').trim().toUpperCase()
  if (/^[A-Z]{2}$/.test(code)) return CONSENT_COUNTRIES.has(code)
  return !!timeZone && CONSENT_TIME_ZONES.test(timeZone)
}
