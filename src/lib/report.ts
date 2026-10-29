import type { Expense } from './types'
import { cost } from './finance'

export type VarianceRow = { category: string; estimated: number; actual: number; diff: number }

export function plannedVsActual(expenses: Expense[]): VarianceRow[] {
  const rows = new Map<string, VarianceRow>()
  for (const e of expenses.filter((x) => x.paid)) {
    const r = rows.get(e.category) ?? { category: e.category, estimated: 0, actual: 0, diff: 0 }
    r.estimated += e.amount
    r.actual += cost(e)
    r.diff = r.actual - r.estimated
    rows.set(e.category, r)
  }
  return [...rows.values()].sort((a, b) => b.actual - a.actual)
}
