import { describe, expect, it } from 'vitest'
import { addMonths, generateEntries } from './recurring'
import type { Recurring, State } from './types'

const rule = (p: Partial<Recurring> = {}): Recurring => ({
  id: 'r1', kind: 'expense', name: 'Netflix', amount: 8000, category: 'Subscriptions', dayOfMonth: 5, startMonth: '2025-01', ...p,
})
const st = (recurring: Recurring[], p: Partial<State> = {}): State => ({
  incomes: [], expenses: [], goals: [], startingBalance: 0, recurring, categories: [], ...p,
})

describe('addMonths', () => {
  it('rolls over the year', () => {
    expect(addMonths('2025-11', 3)).toBe('2026-02')
  })
})

describe('generateEntries', () => {
  it('creates one planned entry per month', () => {
    const { expenses, incomes } = generateEntries(st([rule()]), '2025-01', 3)
    expect(incomes).toHaveLength(0)
    expect(expenses.map((e) => e.date)).toEqual(['2025-01-05', '2025-02-05', '2025-03-05'])
    expect(expenses.every((e) => !e.paid && e.source?.startsWith('r1:'))).toBe(true)
  })

  it('creates expected (not received) income for income rules', () => {
    const { incomes } = generateEntries(st([rule({ kind: 'income', name: 'Salary', amount: 500000 })]), '2025-01', 1)
    expect(incomes).toHaveLength(1)
    expect(incomes[0].received).toBe(false)
  })

  it('skips months before the rule starts', () => {
    const { expenses } = generateEntries(st([rule({ startMonth: '2025-03' })]), '2025-01', 3)
    expect(expenses.map((e) => e.date)).toEqual(['2025-03-05'])
  })

  it('does not duplicate months that were already generated', () => {
    const first = generateEntries(st([rule()]), '2025-01', 2)
    const second = generateEntries(st([rule()], { expenses: first.expenses }), '2025-01', 3)
    expect(second.expenses.map((e) => e.date)).toEqual(['2025-03-05'])
  })

  it('clamps the day of month to 28', () => {
    const { expenses } = generateEntries(st([rule({ dayOfMonth: 31 })]), '2025-02', 1)
    expect(expenses[0].date).toBe('2025-02-28')
  })
})
