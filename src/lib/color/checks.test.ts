import { describe, expect, it } from 'vitest'
import { evaluatePalette } from './checks'

const statuses = (hexes: string[]) => evaluatePalette(hexes).checks.map((c) => c.status)

describe('evaluatePalette', () => {
  it('fails every check on the lesson "before" palette', () => {
    expect(statuses(['#f3613c', '#1f9d8f', '#8a8a8a'])).not.toContain('pass')
  })

  it('passes the lesson palettes', () => {
    expect(statuses(['#f3613c', '#13403b', '#f4eee2'])).toEqual(['pass', 'pass', 'pass'])
    expect(statuses(['#4b624a', '#e64435', '#f5f6f0'])).toEqual(['pass', 'pass', 'pass'])
    expect(statuses(['#ece5d2', '#b6cbde', '#553e53'])).toEqual(['pass', 'pass', 'pass'])
    expect(evaluatePalette(['#ece5d2', '#b6cbde', '#553e53']).passed).toBe(3)
  })

  it('fails when two colors shout', () => {
    const report = evaluatePalette(['#e63946', '#1d4ed8', '#f5f5f0'])
    expect(report.checks[0].status).toBe('fail')
    expect(report.checks[0].verdict).toContain('#e63946')
  })

  it('names the background when the loud color does not pop', () => {
    const space = evaluatePalette(['#f3613c', '#8a8a8a']).checks[2]
    expect(space.status).toBe('fail')
    expect(space.verdict).toContain('#8a8a8a')
  })

  it('judges two-color palettes by their gap', () => {
    expect(statuses(['#f3613c', '#f4eee2'])[1]).toBe('pass')
    expect(statuses(['#777777', '#888888'])[1]).toBe('fail')
  })
})
