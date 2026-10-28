import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

const card = (label: string) => screen.getByText(label).closest('.card') as HTMLElement

describe('App', () => {
  it('adds income and updates available', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText('Income source'), 'Salary')
    await user.type(screen.getByLabelText('Income amount'), '100000')
    await user.click(screen.getByLabelText('Received'))
    await user.click(screen.getAllByRole('button', { name: 'Add' })[0])
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(within(card('Available now')).getByText(/100,000/)).toBeInTheDocument()
  })

  it('starting balance feeds into available now', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText('Starting balance'), '250000')
    expect(within(card('Available now')).getByText(/250,000/)).toBeInTheDocument()
  })

  it('generates recurring entries without duplicating them', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText('Recurring name'), 'Netflix')
    await user.type(screen.getByLabelText('Recurring amount'), '8000')
    await user.click(screen.getByRole('button', { name: 'Add rule' }))
    await user.click(screen.getByRole('button', { name: 'Generate next 3 months' }))
    expect(screen.getByRole('status')).toHaveTextContent('Added 3 recurring entries')
    expect(screen.getAllByLabelText('Paid: Netflix')).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: 'Generate next 3 months' }))
    expect(screen.getByRole('status')).toHaveTextContent('Nothing new')
    expect(screen.getAllByLabelText('Paid: Netflix')).toHaveLength(3)
  })

  it('edits an existing expense', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText('Expense name'), 'Bus')
    await user.type(screen.getByLabelText('Expense amount'), '5000')
    await user.click(screen.getAllByRole('button', { name: 'Add' })[1])
    await user.click(screen.getByRole('button', { name: 'Edit Bus' }))
    const amount = screen.getByLabelText('Expense amount')
    await user.clear(amount)
    await user.type(amount, '7000')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    const row = screen.getByText('Bus').closest('li') as HTMLElement
    expect(within(row).getByText(/7,000/)).toBeInTheDocument()
    expect(within(row).queryByText(/5,000/)).not.toBeInTheDocument()
    expect(screen.getAllByText('Bus')).toHaveLength(1)
  })

  it('persists data across reloads', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await user.type(screen.getByLabelText('Goal name'), 'Laptop')
    await user.type(screen.getByLabelText('Goal target'), '800000')
    await user.click(screen.getAllByRole('button', { name: 'Add' })[2])
    unmount()
    render(<App />)
    expect(screen.getByText('Laptop')).toBeInTheDocument()
  })
})
