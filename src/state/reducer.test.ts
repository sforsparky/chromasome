import { describe, expect, it } from 'vitest'
import { initState, reducer, type State } from './reducer'
import { MAX_COLORS, MIN_COLORS } from './types'

const hexes = ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51']
const start = (): State => initState(hexes)
const hexesOf = (s: State) => s.present.map((x) => x.hex)

describe('initState', () => {
  it('seeds from hexes', () => {
    expect(hexesOf(start())).toEqual(hexes)
  })
  it('generates a default palette without hexes', () => {
    const s = initState(null)
    expect(s.present).toHaveLength(5)
    expect(s.present.every((x) => /^#[0-9a-f]{6}$/.test(x.hex))).toBe(true)
  })
})

describe('reducer', () => {
  it('MUTATE respects locks and records history', () => {
    let s = start()
    s = reducer(s, { type: 'TOGGLE_LOCK', id: s.present[2].id })
    const next = reducer(s, { type: 'MUTATE' })
    expect(next.present[2].hex).toBe('#e9c46a')
    expect(next.past).toHaveLength(1)
    expect(next.future).toHaveLength(0)
  })

  it('TOGGLE_LOCK does not push history', () => {
    const s = reducer(start(), { type: 'TOGGLE_LOCK', id: start().present[0].id })
    expect(s.past).toHaveLength(0)
  })

  it('ADD inserts at index and stops at MAX', () => {
    let s = reducer(start(), { type: 'ADD', index: 1, hex: '#ABCDEF' })
    expect(hexesOf(s)[1]).toBe('#abcdef')
    expect(s.present).toHaveLength(6)
    while (s.present.length < MAX_COLORS) s = reducer(s, { type: 'ADD', index: s.present.length })
    const capped = reducer(s, { type: 'ADD', index: 0 })
    expect(capped).toBe(s)
  })

  it('REMOVE stops at MIN', () => {
    let s = start()
    while (s.present.length > MIN_COLORS) s = reducer(s, { type: 'REMOVE', id: s.present[0].id })
    const floor = reducer(s, { type: 'REMOVE', id: s.present[0].id })
    expect(floor).toBe(s)
  })

  it('MOVE reorders', () => {
    const s = reducer(start(), { type: 'MOVE', from: 0, to: 4 })
    expect(hexesOf(s)).toEqual(['#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#264653'])
  })

  it('BEGIN_EDIT + SET_HEX is a single undo step', () => {
    let s = start()
    const id = s.present[0].id
    s = reducer(s, { type: 'BEGIN_EDIT' })
    s = reducer(s, { type: 'SET_HEX', id, hex: '#111111' })
    s = reducer(s, { type: 'SET_HEX', id, hex: '#222222' })
    expect(s.past).toHaveLength(1)
    expect(hexesOf(s)[0]).toBe('#222222')
    s = reducer(s, { type: 'UNDO' })
    expect(hexesOf(s)[0]).toBe('#264653')
  })

  it('UNDO / REDO walk the history', () => {
    let s = start()
    s = reducer(s, { type: 'LOAD', hexes: ['#000000', '#ffffff'] })
    expect(hexesOf(s)).toEqual(['#000000', '#ffffff'])
    s = reducer(s, { type: 'UNDO' })
    expect(hexesOf(s)).toEqual(hexes)
    s = reducer(s, { type: 'REDO' })
    expect(hexesOf(s)).toEqual(['#000000', '#ffffff'])
    expect(reducer(s, { type: 'REDO' })).toBe(s)
  })

  it('LOAD ignores invalid sizes', () => {
    const s = start()
    expect(reducer(s, { type: 'LOAD', hexes: ['#000000'] })).toBe(s)
  })
})
