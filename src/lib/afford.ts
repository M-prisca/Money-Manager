import type { summarize } from './finance'
import { firstShortfall } from './timeline'
import type { MonthRow } from './timeline'

type Summary = ReturnType<typeof summarize>

export type Affordability = {
  verdict: 'yes' | 'risky' | 'no'
  remainingSafe: number
  shortMonth?: string
}

export function canAfford(s: Summary, rows: MonthRow[], amount: number): Affordability {
  const shortMonth = firstShortfall(rows.map((r) => ({ ...r, endBalance: r.endBalance - amount })))?.month
  const remainingSafe = s.safeToSpend - amount

  if (amount > s.available) return { verdict: 'no', remainingSafe, shortMonth }
  if (amount <= s.safeToSpend && !shortMonth) return { verdict: 'yes', remainingSafe, shortMonth }
  return { verdict: 'risky', remainingSafe, shortMonth }
}
