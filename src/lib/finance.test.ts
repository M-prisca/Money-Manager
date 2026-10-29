import { describe, expect, it } from 'vitest'
import { summarize } from './finance'
import type { State } from './types'

const st = (p: Partial<State> = {}): State => ({ incomes: [], expenses: [], goals: [], startingBalance: 0, recurring: [], categories: [], ...p })
const inc = (amount: number, received: boolean) => ({ id: 'i', name: 'x', amount, date: '2025-01-01', received })
const exp = (amount: number, paid: boolean) => ({ id: 'e', name: 'x', amount, category: 'Other', date: '2025-01-01', paid })
const goal = (saved: number) => ({ id: 'g', name: 'x', target: 1_000_000, saved })

describe('summarize', () => {
  it('returns zeros for empty state', () => {
    expect(summarize(st())).toEqual({
      received: 0, expected: 0, paid: 0, planned: 0, allocated: 0, reserved: 0, available: 0, forecast: 0, safeToSpend: 0,
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

describe('reserved money', () => {
  const ex = (reserved?: number, paid = false) => ({ id: 'r', name: 'Graduation', amount: 50_000, category: 'Graduation', date: '2025-01-10', paid, reserved })

  it('lowers safe-to-spend but not the cash balance', () => {
    const base = summarize(st({ startingBalance: 100_000, incomes: [{ id: 'i', name: 'Pay', amount: 200_000, date: '2025-01-05', received: false }] }))
    const s = summarize(st({ startingBalance: 100_000, expenses: [ex(30_000)], incomes: [{ id: 'i', name: 'Pay', amount: 200_000, date: '2025-01-05', received: false }] }))
    expect(s.available).toBe(100_000)
    expect(s.reserved).toBe(30_000)
    expect(s.safeToSpend).toBe(70_000)
    expect(base.safeToSpend).toBe(100_000)
  })

  it('does not double count against the forecast', () => {
    const s = summarize(st({ startingBalance: 100_000, expenses: [ex(50_000)] }))
    expect(s.forecast).toBe(50_000)
    expect(s.safeToSpend).toBe(50_000)
  })

  it('is capped at the expense amount and released once paid', () => {
    expect(summarize(st({ startingBalance: 100_000, expenses: [ex(90_000)] })).reserved).toBe(50_000)
    const paid = summarize(st({ startingBalance: 100_000, expenses: [ex(30_000, true)] }))
    expect(paid.reserved).toBe(0)
    expect(paid.available).toBe(50_000)
  })
})
