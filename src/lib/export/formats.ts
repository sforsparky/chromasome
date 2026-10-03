import { hexToHsl, hexToRgb } from '../color/convert'
import { nearestName } from '../color/names'
import { deriveRoles } from '../color/roles'
import type { Palette } from '../../state/types'

export type ExportFormat = 'css' | 'scss' | 'tailwind' | 'json'

export const FORMAT_LABELS: Record<ExportFormat, string> = {
  css: 'CSS',
  scss: 'SCSS',
  tailwind: 'Tailwind',
  json: 'JSON',
}

export const FORMAT_EXTENSIONS: Record<ExportFormat, string> = {
  css: 'css',
  scss: 'scss',
  tailwind: 'js',
  json: 'json',
}

function header(url?: string): string {
  return url ? `/* Chromasome strand: ${url} */\n` : '/* Chromasome strand */\n'
}

type RoleAlias = { name: 'bg' | 'second' | 'accent'; index: number }

/** 60/30/10 aliases for the derived background, second and loud (accent) colors. */
function roleAliases(palette: Palette): RoleAlias[] {
  const { background, second, loud } = deriveRoles(palette.map((s) => s.hex))
  const aliases: RoleAlias[] = [
    { name: 'bg', index: background },
    { name: 'second', index: second },
    { name: 'accent', index: loud },
  ]
  return aliases.filter((a) => a.index >= 0)
}

export function toCss(palette: Palette, url?: string): string {
  const lines = palette.map((s, i) => `  --color-${i + 1}: ${s.hex}; /* ${nearestName(s.hex)} */`)
  const roles = roleAliases(palette).map((a) => `  --color-${a.name}: var(--color-${a.index + 1});`)
  return `${header(url)}:root {\n${lines.join('\n')}\n\n  /* 60/30/10 roles */\n${roles.join('\n')}\n}\n`
}

export function toScss(palette: Palette, url?: string): string {
  const lines = palette.map((s, i) => `$color-${i + 1}: ${s.hex}; // ${nearestName(s.hex)}`)
  const roles = roleAliases(palette).map((a) => `$color-${a.name}: $color-${a.index + 1};`)
  return `${header(url)}${lines.join('\n')}\n\n// 60/30/10 roles\n${roles.join('\n')}\n`
}

export function toTailwind(palette: Palette, url?: string): string {
  const lines = [
    ...palette.map((s, i) => `          'strand-${i + 1}': '${s.hex}', // ${nearestName(s.hex)}`),
    ...roleAliases(palette).map((a) => `          'strand-${a.name}': '${palette[a.index].hex}',`),
  ]
  return (
    `${header(url)}` +
    `// Tailwind v3: merge into tailwind.config.js\n` +
    `// Tailwind v4: paste the pairs into @theme { --color-strand-1: ...; }\n` +
    `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n${lines.join('\n')}\n      },\n    },\n  },\n}\n`
  )
}

export function toJson(palette: Palette, url?: string): string {
  const { roles, calm } = deriveRoles(palette.map((s) => s.hex))
  const data = {
    name: 'Chromasome strand',
    url: url ?? null,
    calm,
    colors: palette.map((s, i) => {
      const { h, s: sat, l } = hexToHsl(s.hex)
      return {
        hex: s.hex,
        name: nearestName(s.hex),
        rgb: hexToRgb(s.hex),
        hsl: { h: Math.round(h), s: Math.round(sat * 100), l: Math.round(l * 100) },
        role: roles[i].role,
        share: Math.round(roles[i].weight * 100),
      }
    }),
  }
  return JSON.stringify(data, null, 2) + '\n'
}

export function exportAs(format: ExportFormat, palette: Palette, url?: string): string {
  switch (format) {
    case 'css':
      return toCss(palette, url)
    case 'scss':
      return toScss(palette, url)
    case 'tailwind':
      return toTailwind(palette, url)
    case 'json':
      return toJson(palette, url)
  }
}

export function exportFilename(palette: Palette, ext: string): string {
  return `chromasome-${palette.map((s) => s.hex.slice(1)).join('-')}.${ext}`
}
