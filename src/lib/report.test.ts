import { describe, it, expect } from 'vitest'
import { plannedVsActual } from './report'
import { summarize } from './finance'
import type { Expense } from './types'

const e = (p: Partial<Expense>): Expense => ({ id: 'a', name: 'x', amount: 1000, category: 'Food', date: '2026-10-01', paid: true, ...p })

describe('plannedVsActual', () => {
  it('compares estimate to actual for paid expenses only', () => {
    const r = plannedVsActual([e({ actual: 1200 }), e({ paid: false, amount: 9999 }), e({ category: 'Travel', amount: 5000, actual: 4000 })])
    expect(r.find((x) => x.category === 'Food')).toMatchObject({ estimated: 1000, actual: 1200, diff: 200 })
    expect(r.find((x) => x.category === 'Travel')?.diff).toBe(-1000)
    expect(r).toHaveLength(2)
  })
  it('treats a paid expense without actual as on budget', () => {
    expect(plannedVsActual([e({})])[0].diff).toBe(0)
  })
  it('uses the actual amount for the real balance, once', () => {
    const s = summarize({ incomes: [], expenses: [e({ actual: 1200 })], goals: [], startingBalance: 10000, recurring: [], categories: [] })
    expect(s.paid).toBe(1200)
    expect(s.available).toBe(8800)
  })
  it('keeps the estimate while still planned, even if an old actual exists', () => {
    const s = summarize({ incomes: [], expenses: [e({ paid: false, actual: 1200 })], goals: [], startingBalance: 0, recurring: [], categories: [] })
    expect(s.planned).toBe(1000)
  })
})
