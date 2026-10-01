import { describe, expect, it } from 'vitest'
import { decodeHash, encodeHash } from './codec'

const hexes = ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51']
const palette = hexes.map((hex, i) => ({ id: String(i), hex, locked: false }))

describe('codec', () => {
  it('encodes to the expected format', () => {
    expect(encodeHash(palette)).toBe('#/264653-2a9d8f-e9c46a-f4a261-e76f51')
  })
  it('round trips', () => {
    expect(decodeHash(encodeHash(palette))).toEqual(hexes)
  })
  it('accepts uppercase and a bare "#" prefix', () => {
    expect(decodeHash('#264653-2A9D8F')).toEqual(['#264653', '#2a9d8f'])
    expect(decodeHash('/264653-2a9d8f')).toEqual(['#264653', '#2a9d8f'])
  })
  it('rejects invalid input', () => {
    expect(decodeHash('')).toBeNull()
    expect(decodeHash('#')).toBeNull()
    expect(decodeHash('#/')).toBeNull()
    expect(decodeHash('#/bad')).toBeNull()
    expect(decodeHash('#/zzzzzz-ffffff')).toBeNull()
    expect(decodeHash('#/264653')).toBeNull()
    expect(decodeHash('#/' + Array(11).fill('264653').join('-'))).toBeNull()
    expect(decodeHash('#/264653--2a9d8f')).toBeNull()
  })
})
