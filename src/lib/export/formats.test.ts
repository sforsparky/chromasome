import { describe, expect, it } from 'vitest'
import { exportFilename, toCss, toJson, toScss, toTailwind } from './formats'

const palette = ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'].map((hex, i) => ({
  id: String(i),
  hex,
  locked: false,
}))
const url = 'https://inmydna.com/chromasome/#/264653-2a9d8f-e9c46a-f4a261-e76f51'

describe('export formats', () => {
  it('css', () => {
    const out = toCss(palette, url)
    expect(out).toContain(`/* Chromasome strand: ${url} */`)
    expect(out).toContain('--color-1: #264653;')
    expect(out).toContain('--color-5: #e76f51;')
    expect(out).toMatch(/^.*\n:root \{/)
  })
  it('scss', () => {
    expect(toScss(palette)).toContain('$color-2: #2a9d8f;')
  })
  it('tailwind', () => {
    const out = toTailwind(palette)
    expect(out).toContain("'strand-3': '#e9c46a'")
    expect(out).toContain('module.exports')
  })
  it('json', () => {
    const data = JSON.parse(toJson(palette, url))
    expect(data.url).toBe(url)
    expect(data.colors).toHaveLength(5)
    expect(data.colors[0]).toMatchObject({ hex: '#264653', rgb: { r: 38, g: 70, b: 83 } })
    expect(data.colors[0].hsl.h).toBe(197)
  })
  it('adds 60/30/10 role aliases without touching the numbered names', () => {
    const lesson = ['#f3613c', '#13403b', '#f4eee2'].map((hex, i) => ({ id: String(i), hex, locked: false }))
    const css = toCss(lesson)
    expect(css).toContain('--color-1: #f3613c;')
    expect(css).toContain('--color-bg: var(--color-3);')
    expect(css).toContain('--color-second: var(--color-2);')
    expect(css).toContain('--color-accent: var(--color-1);')
    expect(css).toMatch(/^.*\n:root \{/)
    expect(toScss(lesson)).toContain('$color-bg: $color-3;')
    expect(toTailwind(lesson)).toContain("'strand-accent': '#f3613c',")
    const json = JSON.parse(toJson(lesson))
    expect(json.colors.map((c: { role: string }) => c.role)).toEqual(['loud', 'second', 'background'])
    expect(json.colors.map((c: { share: number }) => c.share)).toEqual([10, 30, 60])
  })
  it('filename', () => {
    expect(exportFilename(palette, 'css')).toBe('chromasome-264653-2a9d8f-e9c46a-f4a261-e76f51.css')
  })
})
