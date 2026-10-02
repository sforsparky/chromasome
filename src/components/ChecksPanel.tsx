import { copy } from '../copy'
import type { CheckStatus, PaletteReport } from '../lib/color/checks'
import { AlertIcon, CheckIcon, CloseIcon, RatioIcon } from './Icons'
import { RolePreview } from './RolePreview'

type Props = {
  report: PaletteReport
  hexes: string[]
  proportional: boolean
  onProportional: (on: boolean) => void
  onClose: () => void
}

const STATUS_ICON: Record<CheckStatus, typeof CheckIcon> = { pass: CheckIcon, warn: AlertIcon, fail: CloseIcon }

/** Live, non-modal: Space keeps mutating while it is open, and the checks follow along. */
export function ChecksPanel({ report, hexes, proportional, onProportional, onClose }: Props) {
  return (
    <aside id="checks-panel" className="checks" aria-labelledby="checks-title">
      <div className="checks__head">
        <h2 id="checks-title" className="checks__title">
          {copy.checksTitle}
        </h2>
        <button type="button" className="btn btn--icon btn--ghost" onClick={onClose} aria-label={copy.closeChecks} title={copy.closeChecks}>
          <CloseIcon />
        </button>
      </div>

      <p className="checks__summary" aria-live="polite">
        {copy.checksSummary(report.passed, report.checks.length)}
      </p>

      <ul className="checks__list">
        {report.checks.map((c) => {
          const Icon = STATUS_ICON[c.status]
          return (
            <li key={c.id} className={`check check--${c.status}`}>
              <span className="check__icon">
                <Icon width={14} height={14} strokeWidth={3} />
              </span>
              <div>
                <h3 className="check__title">
                  {copy.checkTitles[c.id]}
                  <span className="visually-hidden">: {copy.checkStatus[c.status]}</span>
                </h3>
                <p className="check__verdict">{c.verdict}</p>
              </div>
            </li>
          )
        })}
      </ul>

      <RolePreview hexes={hexes} roles={report} />

      <button type="button" className="btn btn--toggle checks__proportional" aria-pressed={proportional} onClick={() => onProportional(!proportional)}>
        <RatioIcon /> {copy.proportional}
      </button>

      <p className="checks__credit">
        <a href={copy.checksCreditUrl} target="_blank" rel="noopener">
          {copy.checksCredit}
        </a>
      </p>
    </aside>
  )
}
