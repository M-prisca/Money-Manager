import type { State } from './types'

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

export function summarize(s: State) {
  const received = sum(s.incomes.filter((i) => i.received).map((i) => i.amount))
  const expected = sum(s.incomes.filter((i) => !i.received).map((i) => i.amount))
  const paid = sum(s.expenses.filter((e) => e.paid).map((e) => e.amount))
  const planned = sum(s.expenses.filter((e) => !e.paid).map((e) => e.amount))
  const allocated = sum(s.goals.map((g) => g.saved))

  const available = received - paid - allocated
  const forecast = available + expected - planned
  const safeToSpend = Math.max(0, Math.min(available, forecast))

  return { received, expected, paid, planned, allocated, available, forecast, safeToSpend }
}

export const money = (n: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(n)
