import { describe, it, expect } from 'vitest'
import { addCategory, plannedExceedsIncome, spendingByCategory } from './categories'

const e = (category: string, amount: number) => ({ id: category + amount, name: 'x', amount, category, date: '2026-10-01', paid: false })

describe('categories', () => {
  it('totals and sorts spending by category', () => {
    const r = spendingByCategory([e('Food', 1000), e('Travel', 3000), e('Food', 1000)])
    expect(r.map((x) => x.category)).toEqual(['Travel', 'Food'])
    expect(r[0].share).toBeCloseTo(0.6)
  })
  it('handles no expenses', () => expect(spendingByCategory([])).toEqual([]))
  it('warns only when planned exceeds expected income', () => {
    expect(plannedExceedsIncome(100, 99)).toBe(true)
    expect(plannedExceedsIncome(100, 100)).toBe(false)
  })
  it('rejects blank and duplicate category names', () => {
    expect(addCategory(['Food'], '  ')).toBeNull()
    expect(addCategory(['Food'], 'food')).toBeNull()
    expect(addCategory(['Food'], ' Gym ')).toBe('Gym')
  })
})
