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
  it('filename', () => {
    expect(exportFilename(palette, 'css')).toBe('chromasome-264653-2a9d8f-e9c46a-f4a261-e76f51.css')
  })
})
