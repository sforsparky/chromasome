import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = (props: IconProps) => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
})

export const LockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)

export const UnlockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 7.5-2" />
  </svg>
)

export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

export const SlidersIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="8" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
)

export const ChevronLeftIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m15 6-6 6 6 6" />
  </svg>
)

export const ChevronRightIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
)

export const ChevronUpIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 15 6-6 6 6" />
  </svg>
)

export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const GripIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="6" r="1.2" fill="currentColor" />
    <circle cx="15" cy="6" r="1.2" fill="currentColor" />
    <circle cx="9" cy="12" r="1.2" fill="currentColor" />
    <circle cx="15" cy="12" r="1.2" fill="currentColor" />
    <circle cx="9" cy="18" r="1.2" fill="currentColor" />
    <circle cx="15" cy="18" r="1.2" fill="currentColor" />
  </svg>
)

export const PlusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const UndoIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
  </svg>
)

export const RedoIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9a5 5 0 0 0 0 10h3" />
  </svg>
)

export const LinkIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
    <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
  </svg>
)

export const DownloadIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4v12M6 10l6 6 6-6" />
    <path d="M4 20h16" />
  </svg>
)

export const ImageIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="m21 16-5-5-8 8" />
  </svg>
)

export const CoffeeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
    <path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17" />
    <path d="M8 3.5c0 1 1 1.5 1 2.5M12 3.5c0 1 1 1.5 1 2.5" />
  </svg>
)

export const EyeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const ChecksIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m4 6 1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17" />
    <path d="M12 6h8M12 12h8M12 18h8" />
  </svg>
)

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 12 5 5 9-10" />
  </svg>
)

export const AlertIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 7v6M12 17h0" />
  </svg>
)

export const RatioIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M14 5v14M18.5 5v14" />
  </svg>
)

/** iOS-style Share: a box with an arrow out of the top. */
export const ShareIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 15V3M8 7l4-4 4 4M8 11H6v10h12V11h-2" />
  </svg>
)

export const CookieIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3.5-3A3 3 0 0 1 14 5.5 3 3 0 0 1 12 3Z" />
    <path d="M8.5 9.5h.01M15 15h.01M10 15.5h.01" />
  </svg>
)

export const MoreIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="5" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="19" r="1.2" fill="currentColor" />
  </svg>
)

/** The Chromasome mark in brand colors: warm strand, white rungs, cool strand over them (matches the app icon). */
/**
 * The 8-bit helix, 14×21 pixels. W = warm strand, C = cool strand, R = rung.
 * The cool strand is painted last, so it passes over the rungs and the warm strand.
 */
const MARK = [
  'WW..........CC',
  'WW..........CC',
  '.WW........CC.',
  '.WW........CC.',
  '..WWWRRRRCCC..',
  '....WWWCCC....',
  '.....CCCW.....',
  '....CCCWWW....',
  '..CCC....WWW..',
  '.CCC......WWW.',
  '.CCRRRRRR..WW.',
  'CC..........WW',
  'CC..........WW',
  'CC..........WW',
  'CC..........WW',
  '.CC........WW.',
  '.CCCRRRRRRWWW.',
  '..CCCC..WWWW..',
  '.....CCCCW....',
  'WWWWWWWCCCCCCC',
  'WWW........CCC',
]
// Each strand's gradient in five flat steps, top to bottom, the way an 8-bit palette would band it.
const WARM_BANDS = ['#ff4d6d', '#ff7645', '#ff9f1c', '#ffb92e', '#ffd23f']
const COOL_BANDS = ['#3ddc84', '#36d0c2', '#2ec4ff', '#5c90ff', '#8a5cff']

/** One rect per horizontal run of a single color. */
const MARK_RUNS = MARK.flatMap((line, y) => {
  const band = Math.round((y / (MARK.length - 1)) * (WARM_BANDS.length - 1))
  const colorOf = (ch: string) => (ch === 'W' ? WARM_BANDS[band] : ch === 'C' ? COOL_BANDS[band] : ch === 'R' ? '#ffffff' : null)
  const runs: { x: number; y: number; w: number; fill: string }[] = []
  for (let x = 0; x < line.length; ) {
    const fill = colorOf(line[x])
    let w = 1
    while (x + w < line.length && colorOf(line[x + w]) === fill) w++
    if (fill) runs.push({ x, y, w, fill })
    x += w
  }
  return runs
})

export const BrandMark = ({ width = 14, height = 21, ...rest }: IconProps) => (
  <svg width={width} height={height} viewBox="0 0 14 21" shapeRendering="crispEdges" aria-hidden="true" focusable="false" {...rest}>
    {MARK_RUNS.map((r) => (
      <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
    ))}
  </svg>
)
