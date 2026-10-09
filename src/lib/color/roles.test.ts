import { describe, expect, it } from 'vitest'
import { deriveRoles } from './roles'

const AFTER = ['#f3613c', '#13403b', '#f4eee2']
const GINKGO = ['#4b624a', '#e64435', '#f5f6f0']
const CALM = ['#ece5d2', '#b6cbde', '#553e53']

const roleNames = (hexes: string[]) => deriveRoles(hexes).roles.map((r) => r.role)

describe('deriveRoles', () => {
  it('reads the lesson palettes', () => {
    expect(roleNames(AFTER)).toEqual(['loud', 'second', 'background'])
    expect(roleNames(GINKGO)).toEqual(['second', 'loud', 'background'])
    const calm = deriveRoles(CALM)
    expect(calm.calm).toBe(true)
    expect(calm.roles.map((r) => r.role)).toEqual(['background', 'second', 'accent'])
  })

  it('gives exactly 60/30/10 at three colors', () => {
    expect(deriveRoles(AFTER).roles.map((r) => r.weight)).toEqual([0.1, 0.3, 0.6].map((w) => expect.closeTo(w, 10)))
  })

  it('sums weights to 1 and gives loud the smallest share at every size', () => {
    const pool = ['#f5f6f0', '#e64435', '#13403b', '#8a8a8a', '#b6cbde', '#553e53', '#ece5d2', '#4b624a', '#222222', '#dddddd']
    for (let n = 2; n <= 10; n++) {
      const { roles, loud } = deriveRoles(pool.slice(0, n))
      expect(roles.reduce((a, r) => a + r.weight, 0)).toBeCloseTo(1, 10)
      expect(Math.min(...roles.map((r) => r.weight))).toBe(roles[loud].weight)
    }
  })

  it('handles two colors', () => {
    expect(roleNames(['#f3613c', '#f4eee2'])).toEqual(['loud', 'background'])
    expect(roleNames(['#222222', '#dddddd']).sort()).toEqual(['accent', 'background'])
  })

  it('follows the hexes, not their order', () => {
    const shuffled = [GINKGO[2], GINKGO[0], GINKGO[1]]
    expect(roleNames(shuffled)).toEqual(['background', 'second', 'loud'])
  })
})
