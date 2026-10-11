import { copy } from '../copy'

/** Cookie consent for visitors in the EEA, UK and Switzerland. Both answers carry the same weight. */
export function ConsentBanner({ onDecide, closing }: { onDecide: (choice: 'granted' | 'denied') => void; closing: boolean }) {
  return (
    <aside className={`consent${closing ? ' is-closing' : ''}`} aria-label={copy.consentLabel} inert={closing}>
      <p className="consent__text">
        {copy.consentText}{' '}
        <a href={copy.privacyUrl} target="_blank" rel="noopener noreferrer">
          {copy.privacyPolicy}
        </a>
      </p>
      <div className="consent__actions">
        <button type="button" className="btn" onClick={() => onDecide('denied')}>
          {copy.consentDecline}
        </button>
        <button type="button" className="btn" onClick={() => onDecide('granted')}>
          {copy.consentAccept}
        </button>
      </div>
    </aside>
  )
}
