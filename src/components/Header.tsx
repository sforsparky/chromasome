import { copy } from '../copy'
import { BrandMark, CoffeeIcon } from './Icons'

/** CHROMA takes the helix's six colors, one per letter; SOME stays plain. */
const SPECTRUM = ['#ff4d6d', '#ff9f1c', '#ffd23f', '#3ddc84', '#2ec4ff', '#8a5cff']
const CHROMA = copy.appName.slice(0, SPECTRUM.length)

/** onCookieSettings is set only where cookie consent applies (EEA, UK, Switzerland). */
export function Header({ onCookieSettings }: { onCookieSettings?: () => void }) {
  return (
    <header className="header">
      <a className="header__brand" href={copy.brandUrl} rel="noreferrer">
        <BrandMark />
        <span className="header__name">
          {[...CHROMA].map((ch, i) => (
            <span key={i} style={{ color: SPECTRUM[i] }}>
              {ch}
            </span>
          ))}
          {copy.appName.slice(CHROMA.length)}
        </span>
      </a>
      {onCookieSettings && (
        <button type="button" className="header__cookies" onClick={onCookieSettings}>
          {copy.cookies}
        </button>
      )}
      <a className="header__coffee" href={copy.coffeeUrl} target="_blank" rel="noopener noreferrer" aria-label={copy.coffee} title={copy.coffee}>
        <CoffeeIcon width={16} height={16} />
        <span className="header__coffee-label">{copy.coffee}</span>
      </a>
      <a className="header__by" href={copy.brandUrl} rel="noreferrer">
        {copy.brandHost}
      </a>
    </header>
  )
}
