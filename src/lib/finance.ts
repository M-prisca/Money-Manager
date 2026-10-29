import type { Expense, State } from './types'

export const cost = (e: Expense) => (e.paid ? (e.actual ?? e.amount) : e.amount)

export const reservedOf = (e: Expense) => (e.paid ? 0 : Math.min(Math.max(e.reserved ?? 0, 0), e.amount))
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

export function summarize(s: State) {
  const received = sum(s.incomes.filter((i) => i.received).map((i) => i.amount))
  const expected = sum(s.incomes.filter((i) => !i.received).map((i) => i.amount))
  const paid = sum(s.expenses.filter((e) => e.paid).map(cost))
  const planned = sum(s.expenses.filter((e) => !e.paid).map((e) => e.amount))
  const allocated = sum(s.goals.map((g) => g.saved))

  const reserved = sum(s.expenses.filter((e) => !e.paid).map(reservedOf))
  const available = s.startingBalance + received - paid - allocated
  const forecast = available + expected - planned
  const safeToSpend = Math.max(0, Math.min(available - reserved, forecast))

  return { received, expected, paid, planned, allocated, reserved, available, forecast, safeToSpend }
}

export const money = (n: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(n)
