import { useEffect, useState } from 'react'
import type { State } from './types'

const KEY = 'money-manager-v1'
const empty: State = { incomes: [], expenses: [], goals: [], startingBalance: 0 }

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty, ...JSON.parse(raw) } : empty
  } catch {
    return empty
  }
}

export function useStore() {
  const [state, setState] = useState<State>(load)
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(state)), [state])
  return [state, setState] as const
}

export const uid = () => crypto.randomUUID()

export function parseBackup(text: string): State | null {
  try {
    const d = JSON.parse(text)
    if (!d || !Array.isArray(d.incomes) || !Array.isArray(d.expenses) || !Array.isArray(d.goals)) return null
    const startingBalance = typeof d.startingBalance === 'number' ? d.startingBalance : 0
    return { incomes: d.incomes, expenses: d.expenses, goals: d.goals, startingBalance }
  } catch {
    return null
  }
}
