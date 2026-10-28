import { describe, expect, it } from 'vitest'
import { planGoal } from './goals'
import type { Goal } from './types'

const goal = (p: Partial<Goal> = {}): Goal => ({ id: 'g', name: 'Laptop', target: 600_000, saved: 0, ...p })

describe('planGoal', () => {
  it('returns null without a deadline', () => {
    expect(planGoal(goal(), '2025-01')).toBeNull()
  })

  it('splits the remaining amount over the months left, counting the current month', () => {
    const p = planGoal(goal({ saved: 0, deadline: '2025-06-30' }), '2025-01')
    expect(p).toMatchObject({ months: 6, perMonth: 100_000, overdue: false })
  })

  it('rounds the monthly amount up', () => {
    const p = planGoal(goal({ target: 1000, deadline: '2025-03-01' }), '2025-01')
    expect(p?.perMonth).toBe(334)
  })

  it('uses only what is still missing', () => {
    const p = planGoal(goal({ saved: 300_000, deadline: '2025-03-15' }), '2025-01')
    expect(p).toMatchObject({ remaining: 300_000, perMonth: 100_000 })
  })

  it('needs everything now when the deadline is this month', () => {
    const p = planGoal(goal({ saved: 100_000, deadline: '2025-01-31' }), '2025-01')
    expect(p).toMatchObject({ months: 1, perMonth: 500_000 })
  })

  it('flags unfinished goals past their deadline as overdue', () => {
    expect(planGoal(goal({ deadline: '2024-12-31' }), '2025-01')?.overdue).toBe(true)
  })

  it('is not overdue once fully saved', () => {
    const p = planGoal(goal({ saved: 600_000, deadline: '2024-12-31' }), '2025-01')
    expect(p).toMatchObject({ overdue: false, perMonth: 0 })
  })
})
