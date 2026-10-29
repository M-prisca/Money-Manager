import type { Expense, State } from './types'
import { CATEGORIES } from './types'

export type CategoryTotal = { category: string; total: number; share: number }

export const allCategories = (s: State) => [...CATEGORIES, ...s.categories]

export function spendingByCategory(expenses: Expense[]): CategoryTotal[] {
  const totals = new Map<string, number>()
  for (const e of expenses) totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount)
  const all = [...totals.values()].reduce((a, b) => a + b, 0)
  return [...totals]
    .map(([category, total]) => ({ category, total, share: all ? total / all : 0 }))
    .sort((a, b) => b.total - a.total)
}

export const plannedExceedsIncome = (planned: number, expected: number) => planned > expected

export function addCategory(existing: string[], name: string): string | null {
  const clean = name.trim()
  if (!clean) return null
  if (existing.some((c) => c.toLowerCase() === clean.toLowerCase())) return null
  return clean
}
