import type { CSSProperties } from 'react'
import { copy } from '../copy'
import { textColorFor } from '../lib/color/contrast'
import type { Roles } from '../lib/color/roles'

type Props = { hexes: string[]; roles: Roles }

const percent = (w: number) => Math.round(w * 100)

/** The strand at its 60/30/10 proportions, plus a tiny mock page painted with it. */
export function RolePreview({ hexes, roles }: Props) {
  const order = hexes.map((_, i) => i).sort((a, b) => roles.roles[b].weight - roles.roles[a].weight)
  const label = order.map((i) => `${copy.roleLabels[roles.roles[i].role]} ${percent(roles.roles[i].weight)}%`).join(', ')
  const paint = (i: number): CSSProperties => ({ backgroundColor: hexes[i], color: textColorFor(hexes[i]) })
  const panel = roles.second >= 0 ? roles.second : roles.background

  return (
    <div className="preview">
      <div className="preview__bar" role="img" aria-label={label}>
        {order.map((i, k) => (
          <span key={k} className="preview__segment" style={{ ...paint(i), flexGrow: roles.roles[i].weight }}>
            {roles.roles[i].weight >= 0.15 && `${percent(roles.roles[i].weight)}%`}
          </span>
        ))}
      </div>
      <div className="preview__mock" style={paint(roles.background)} aria-hidden="true">
        <span className="preview__heading" />
        <div className="preview__panel" style={paint(panel)}>
          <span className="preview__line" />
          <span className="preview__line preview__line--short" />
          {roles.loud >= 0 && (
            <span className="preview__button" style={paint(roles.loud)}>
              {copy.mutate}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
