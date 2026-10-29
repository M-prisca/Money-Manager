export type Income = {
  id: string
  name: string
  amount: number
  date: string
  received: boolean
  source?: string
}

export type Expense = {
  id: string
  name: string
  amount: number
  category: string
  date: string
  paid: boolean
  source?: string
}

export type Goal = {
  id: string
  name: string
  target: number
  saved: number
  deadline?: string
}

export type Recurring = {
  id: string
  kind: 'income' | 'expense'
  name: string
  amount: number
  category: string
  dayOfMonth: number
  startMonth: string
}

export type State = {
  incomes: Income[]
  expenses: Expense[]
  goals: Goal[]
  startingBalance: number
  recurring: Recurring[]
  categories: string[]
}

export const CATEGORIES = [
  'Graduation',
  'Transport',
  'Subscriptions',
  'Travel',
  'Food',
  'Housing',
  'Other',
]
