import { describe, expect, it } from 'vitest'
import { buildTimeline, firstShortfall } from './timeline'
import type { State } from './types'

const st = (p: Partial<State> = {}): State => ({
  incomes: [], expenses: [], goals: [], startingBalance: 0, recurring: [], categories: [], ...p,
})
const inc = (amount: number, date: string, received = false) => ({ id: date + amount, name: 'x', amount, date, received })
const exp = (amount: number, date: string, paid = false) => ({ id: date + amount, name: 'x', amount, category: 'Other', date, paid })

describe('buildTimeline', () => {
  it('starts from the current available balance', () => {
    const rows = buildTimeline(st({ startingBalance: 10_000, incomes: [inc(5_000, '2025-01-01', true)] }), '2025-01', 2)
    expect(rows.map((r) => r.endBalance)).toEqual([15_000, 15_000])
  })

  it('accumulates income and expenses month by month', () => {
    const rows = buildTimeline(
      st({
        startingBalance: 100,
        incomes: [inc(500, '2025-02-10')],
        expenses: [exp(200, '2025-01-15'), exp(300, '2025-02-20')],
      }),
      '2025-01',
      3,
    )
    expect(rows.map((r) => r.endBalance)).toEqual([-100, 100, 100])
    expect(rows[1]).toMatchObject({ income: 500, expenses: 300 })
  })

  it('puts overdue unpaid items into the first month', () => {
    const rows = buildTimeline(st({ expenses: [exp(100, '2024-06-01')] }), '2025-01', 2)
    expect(rows[0].expenses).toBe(100)
  })

  it('ignores received income and paid expenses as future flows', () => {
    const rows = buildTimeline(st({ incomes: [inc(100, '2025-01-05', true)], expenses: [exp(50, '2025-01-06', true)] }), '2025-01', 1)
    expect(rows[0]).toMatchObject({ income: 0, expenses: 0 })
  })

  it('subtracts money already saved for goals', () => {
    const rows = buildTimeline(st({ startingBalance: 1000, goals: [{ id: 'g', name: 'x', target: 900, saved: 400 }] }), '2025-01', 1)
    expect(rows[0].endBalance).toBe(600)
  })
})

describe('firstShortfall', () => {
  it('finds the first negative month', () => {
    const rows = buildTimeline(st({ expenses: [exp(100, '2025-02-01')] }), '2025-01', 3)
    expect(firstShortfall(rows)?.month).toBe('2025-02')
  })

  it('returns undefined when never short', () => {
    expect(firstShortfall(buildTimeline(st({ startingBalance: 1 }), '2025-01', 3))).toBeUndefined()
  })
})
