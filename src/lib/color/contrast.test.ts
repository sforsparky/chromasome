import { describe, expect, it } from 'vitest'
import { contrastRatio, textColorFor, wcagLevel, TEXT_DARK, TEXT_LIGHT } from './contrast'

describe('contrast', () => {
  it('white on black is 21:1', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 2)
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 2)
  })
  it('same color is 1:1', () => {
    expect(contrastRatio('#2a9d8f', '#2a9d8f')).toBeCloseTo(1, 5)
  })
  it('picks readable text', () => {
    expect(textColorFor('#ffffff')).toBe(TEXT_DARK)
    expect(textColorFor('#e9c46a')).toBe(TEXT_DARK)
    expect(textColorFor('#000080')).toBe(TEXT_LIGHT)
    expect(textColorFor('#264653')).toBe(TEXT_LIGHT)
  })
  it('maps ratios to WCAG levels', () => {
    expect(wcagLevel(21)).toBe('AAA')
    expect(wcagLevel(5)).toBe('AA')
    expect(wcagLevel(3.2)).toBe('AA Large')
    expect(wcagLevel(1.5)).toBe('Fail')
  })
})
