import { describe, expect, it } from 'vitest'
import { canAfford } from './afford'
import { summarize } from './finance'
import { buildTimeline } from './timeline'
import type { State } from './types'

const st = (p: Partial<State> = {}): State => ({
  incomes: [], expenses: [], goals: [], startingBalance: 0, recurring: [], ...p,
})
const exp = (amount: number, date: string) => ({ id: date + amount, name: 'x', amount, category: 'Other', date, paid: false })

const check = (state: State, amount: number) =>
  canAfford(summarize(state), buildTimeline(state, '2025-01', 6), amount)

describe('canAfford', () => {
  it('says yes when within safe-to-spend and no month goes short', () => {
    expect(check(st({ startingBalance: 100_000 }), 40_000)).toMatchObject({ verdict: 'yes', remainingSafe: 60_000 })
  })

  it('says no when the amount exceeds what is available now', () => {
    expect(check(st({ startingBalance: 10_000 }), 20_000).verdict).toBe('no')
  })

  it('is risky when affordable now but breaks the forecast', () => {
    const r = check(st({ startingBalance: 100_000, expenses: [exp(80_000, '2025-03-01')] }), 50_000)
    expect(r.verdict).toBe('risky')
    expect(r.shortMonth).toBe('2025-03')
  })

  it('is risky when the timeline dips below zero even if the total forecast is fine', () => {
    const state = st({
      startingBalance: 50_000,
      incomes: [{ id: 'i', name: 'x', amount: 200_000, date: '2025-05-01', received: false }],
      expenses: [exp(40_000, '2025-02-01')],
    })
    const r = check(state, 20_000)
    expect(r.verdict).toBe('risky')
    expect(r.shortMonth).toBe('2025-02')
  })

  it('allows spending exactly what is safe', () => {
    expect(check(st({ startingBalance: 30_000 }), 30_000).verdict).toBe('yes')
  })
})
