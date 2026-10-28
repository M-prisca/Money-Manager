import { describe, expect, it } from 'vitest'
import { summarize } from './finance'
import type { State } from './types'

const st = (p: Partial<State> = {}): State => ({ incomes: [], expenses: [], goals: [], startingBalance: 0, recurring: [], ...p })
const inc = (amount: number, received: boolean) => ({ id: 'i', name: 'x', amount, date: '2025-01-01', received })
const exp = (amount: number, paid: boolean) => ({ id: 'e', name: 'x', amount, category: 'Other', date: '2025-01-01', paid })
const goal = (saved: number) => ({ id: 'g', name: 'x', target: 1_000_000, saved })

describe('summarize', () => {
  it('returns zeros for empty state', () => {
    expect(summarize(st())).toEqual({
      received: 0, expected: 0, paid: 0, planned: 0, allocated: 0, available: 0, forecast: 0, safeToSpend: 0,
    })
  })

  it('computes available as received - paid - saved', () => {
    const s = summarize(st({ incomes: [inc(100_000, true)], expenses: [exp(20_000, true)], goals: [goal(30_000)] }))
    expect(s.available).toBe(50_000)
  })

  it('includes the starting balance in available and forecast', () => {
    const s = summarize(st({ startingBalance: 40_000, incomes: [inc(10_000, true)], expenses: [exp(5_000, false)] }))
    expect(s.available).toBe(50_000)
    expect(s.forecast).toBe(45_000)
  })

  it('ignores expected income and planned expenses in available', () => {
    const s = summarize(st({ incomes: [inc(100_000, true), inc(50_000, false)], expenses: [exp(10_000, false)] }))
    expect(s.available).toBe(100_000)
  })

  it('forecast adds expected income and subtracts planned expenses', () => {
    const s = summarize(st({ incomes: [inc(100_000, true), inc(50_000, false)], expenses: [exp(30_000, false)] }))
    expect(s.forecast).toBe(120_000)
  })

  it('safe to spend is the lower of available and forecast', () => {
    const s = summarize(st({ incomes: [inc(100_000, true)], expenses: [exp(70_000, false)] }))
    expect(s.available).toBe(100_000)
    expect(s.forecast).toBe(30_000)
    expect(s.safeToSpend).toBe(30_000)
  })

  it('safe to spend is never negative', () => {
    const s = summarize(st({ incomes: [inc(10_000, true)], expenses: [exp(50_000, false)] }))
    expect(s.forecast).toBe(-40_000)
    expect(s.safeToSpend).toBe(0)
  })
})
