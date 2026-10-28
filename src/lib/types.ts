export type Income = {
  id: string
  name: string
  amount: number
  date: string
  received: boolean
}

export type Expense = {
  id: string
  name: string
  amount: number
  category: string
  date: string
  paid: boolean
}

export type Goal = {
  id: string
  name: string
  target: number
  saved: number
}

export type State = {
  incomes: Income[]
  expenses: Expense[]
  goals: Goal[]
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
