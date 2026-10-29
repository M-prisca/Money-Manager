import { describe, expect, it } from 'vitest'
import { parseBackup } from './store'

describe('parseBackup', () => {
  it('accepts a valid backup', () => {
    const json = JSON.stringify({ incomes: [], expenses: [], goals: [], startingBalance: 5000 })
    expect(parseBackup(json)).toEqual({ incomes: [], expenses: [], goals: [], startingBalance: 5000, recurring: [], categories: [] })
  })

  it('defaults the starting balance for older backups', () => {
    const json = JSON.stringify({ incomes: [], expenses: [], goals: [] })
    expect(parseBackup(json)?.startingBalance).toBe(0)
  })

  it('rejects invalid JSON', () => {
    expect(parseBackup('not json')).toBeNull()
  })

  it('rejects wrong shape', () => {
    expect(parseBackup(JSON.stringify({ incomes: [] }))).toBeNull()
    expect(parseBackup('null')).toBeNull()
  })
})
