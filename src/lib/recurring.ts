import type { Expense, Income, State } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7)
}

export function generateEntries(state: State, fromYm: string, months: number) {
  const seen = new Set<string>()
  for (const x of [...state.incomes, ...state.expenses]) if (x.source) seen.add(x.source)

  const incomes: Income[] = []
  const expenses: Expense[] = []

  for (let i = 0; i < months; i++) {
    const ym = addMonths(fromYm, i)
    for (const r of state.recurring) {
      const source = `${r.id}:${ym}`
      if (ym < r.startMonth || seen.has(source)) continue
      const date = `${ym}-${pad(Math.min(28, Math.max(1, r.dayOfMonth)))}`
      const id = crypto.randomUUID()
      if (r.kind === 'income') incomes.push({ id, name: r.name, amount: r.amount, date, received: false, source })
      else expenses.push({ id, name: r.name, amount: r.amount, category: r.category, date, paid: false, source })
    }
  }
  return { incomes, expenses }
}
