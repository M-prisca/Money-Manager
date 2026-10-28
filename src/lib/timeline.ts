import { addMonths } from './recurring'
import type { State } from './types'

export type MonthRow = {
  month: string
  income: number
  expenses: number
  endBalance: number
}

export function buildTimeline(state: State, fromYm: string, months: number): MonthRow[] {
  const bucket = (date: string) => {
    const ym = date.slice(0, 7)
    return ym < fromYm ? fromYm : ym
  }

  let balance =
    state.startingBalance +
    state.incomes.filter((i) => i.received).reduce((a, i) => a + i.amount, 0) -
    state.expenses.filter((e) => e.paid).reduce((a, e) => a + e.amount, 0) -
    state.goals.reduce((a, g) => a + g.saved, 0)

  const rows: MonthRow[] = []
  for (let n = 0; n < months; n++) {
    const month = addMonths(fromYm, n)
    const income = state.incomes
      .filter((i) => !i.received && bucket(i.date) === month)
      .reduce((a, i) => a + i.amount, 0)
    const expenses = state.expenses
      .filter((e) => !e.paid && bucket(e.date) === month)
      .reduce((a, e) => a + e.amount, 0)
    balance += income - expenses
    rows.push({ month, income, expenses, endBalance: balance })
  }
  return rows
}

export const firstShortfall = (rows: MonthRow[]) => rows.find((r) => r.endBalance < 0)
