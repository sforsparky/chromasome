import { copy } from '../copy'
import { DnaIcon } from './Icons'

export function Header() {
  return (
    <header className="header">
      <a className="header__brand" href={copy.brandUrl} rel="noreferrer">
        <DnaIcon width={22} height={22} />
        <span className="header__name">{copy.appName}</span>
      </a>
      <a className="header__by" href={copy.brandUrl} rel="noreferrer">
        {copy.brandHost}
      </a>
    </header>
  )
}
