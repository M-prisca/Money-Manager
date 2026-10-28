import type { Goal } from './types'

export type GoalPlan = {
  remaining: number
  months: number
  perMonth: number
  overdue: boolean
}

export function planGoal(goal: Goal, todayYm: string): GoalPlan | null {
  if (!goal.deadline) return null
  const remaining = Math.max(0, goal.target - goal.saved)
  const [ty, tm] = todayYm.split('-').map(Number)
  const [dy, dm] = goal.deadline.slice(0, 7).split('-').map(Number)
  const diff = (dy - ty) * 12 + (dm - tm)
  if (remaining === 0) return { remaining, months: Math.max(0, diff + 1), perMonth: 0, overdue: false }
  if (diff < 0) return { remaining, months: 0, perMonth: remaining, overdue: true }
  const months = diff + 1
  return { remaining, months, perMonth: Math.ceil(remaining / months), overdue: false }
}
