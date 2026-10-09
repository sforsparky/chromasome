import { copy } from '../copy'
import { BrandMark, CoffeeIcon } from './Icons'

export function Header() {
  return (
    <header className="header">
      <a className="header__brand" href={copy.brandUrl} rel="noreferrer">
        <BrandMark width={22} height={22} />
        <span className="header__name">{copy.appName}</span>
      </a>
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
