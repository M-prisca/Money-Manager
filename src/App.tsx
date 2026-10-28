import { useRef, useState } from 'react'
import { summarize, money } from './lib/finance'
import { useStore, uid, parseBackup } from './lib/store'
import { generateEntries } from './lib/recurring'
import { buildTimeline, firstShortfall } from './lib/timeline'
import { planGoal } from './lib/goals'
import { canAfford } from './lib/afford'
import { CATEGORIES } from './lib/types'
import type { Expense, Goal, Income } from './lib/types'

const today = () => new Date().toISOString().slice(0, 10)
const monthLabel = (ym: string) =>
  new Date(`${ym}-01`).toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' })
const emptyRec = () => ({ kind: 'expense' as 'income' | 'expense', name: '', amount: '', category: CATEGORIES[2], day: '1' })
const emptyInc = () => ({ name: '', amount: '', date: today(), received: false })
const emptyExp = () => ({ name: '', amount: '', category: CATEGORIES[0], date: today() })
const emptyGoal = () => ({ name: '', target: '', deadline: '' })

export default function App() {
  const [state, setState] = useStore()
  const s = summarize(state)
  const timeline = buildTimeline(state, today().slice(0, 7), 6)
  const shortfall = firstShortfall(timeline)
  const [checkAmount, setCheckAmount] = useState('')
  const checkValue = parseFloat(checkAmount)
  const afford = checkValue > 0 ? canAfford(s, timeline, checkValue) : null

  const [inc, setInc] = useState(emptyInc)
  const [exp, setExp] = useState(emptyExp)
  const [goal, setGoal] = useState(emptyGoal)
  const [editInc, setEditInc] = useState<string | null>(null)
  const [editExp, setEditExp] = useState<string | null>(null)
  const [editGoal, setEditGoal] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [rec, setRec] = useState(emptyRec)
  const fileRef = useRef<HTMLInputElement>(null)

  const addRecurring = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(rec.amount)
    const dayOfMonth = parseInt(rec.day, 10)
    if (!rec.name || !(amount > 0) || !(dayOfMonth >= 1 && dayOfMonth <= 31)) return
    setState((p) => ({
      ...p,
      recurring: [
        ...p.recurring,
        { id: uid(), kind: rec.kind, name: rec.name, amount, category: rec.category, dayOfMonth, startMonth: today().slice(0, 7) },
      ],
    }))
    setRec(emptyRec())
  }

  const generateNext = () => {
    const made = generateEntries(state, today().slice(0, 7), 3)
    const count = made.incomes.length + made.expenses.length
    setState((p) => ({ ...p, incomes: [...p.incomes, ...made.incomes], expenses: [...p.expenses, ...made.expenses] }))
    setMessage(count ? `Added ${count} recurring entries for the next 3 months.` : 'Nothing new to add: the next 3 months are already generated.')
  }

  const submitIncome = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(inc.amount)
    if (!inc.name || !(amount > 0)) return
    setState((p) => ({
      ...p,
      incomes: editInc
        ? p.incomes.map((x) => (x.id === editInc ? { ...x, ...inc, amount } : x))
        : [...p.incomes, { id: uid(), ...inc, amount }],
    }))
    setEditInc(null)
    setInc(emptyInc())
  }

  const submitExpense = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(exp.amount)
    if (!exp.name || !(amount > 0)) return
    setState((p) => ({
      ...p,
      expenses: editExp
        ? p.expenses.map((x) => (x.id === editExp ? { ...x, ...exp, amount } : x))
        : [...p.expenses, { id: uid(), ...exp, amount, paid: false }],
    }))
    setEditExp(null)
    setExp(emptyExp())
  }

  const submitGoal = (e: React.FormEvent) => {
    e.preventDefault()
    const target = parseFloat(goal.target)
    if (!goal.name || !(target > 0)) return
    setState((p) => ({
      ...p,
      goals: editGoal
        ? p.goals.map((x) => (x.id === editGoal ? { ...x, name: goal.name, target, saved: Math.min(x.saved, target), deadline: goal.deadline || undefined } : x))
        : [...p.goals, { id: uid(), name: goal.name, target, saved: 0, deadline: goal.deadline || undefined }],
    }))
    setEditGoal(null)
    setGoal(emptyGoal())
  }

  const startEditIncome = (i: Income) => {
    setEditInc(i.id)
    setInc({ name: i.name, amount: String(i.amount), date: i.date, received: i.received })
  }
  const startEditExpense = (x: Expense) => {
    setEditExp(x.id)
    setExp({ name: x.name, amount: String(x.amount), category: x.category, date: x.date })
  }
  const startEditGoal = (g: Goal) => {
    setEditGoal(g.id)
    setGoal({ name: g.name, target: String(g.target), deadline: g.deadline ?? '' })
  }

  const contribute = (id: string, delta: number) =>
    setState((p) => ({
      ...p,
      goals: p.goals.map((g) =>
        g.id === id ? { ...g, saved: Math.min(g.target, Math.max(0, g.saved + delta)) } : g,
      ),
    }))

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `money-manager-${today()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = async (file: File | undefined) => {
    if (!file) return
    const parsed = parseBackup(await file.text())
    if (!parsed) {
      setMessage('Import failed: that file is not a Money Manager backup.')
    } else if (window.confirm('Importing replaces all current data. Continue?')) {
      setState(parsed)
      setMessage('Backup imported.')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const sortByDate = <T extends { date: string }>(xs: T[]) =>
    [...xs].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <main>
      <header>
        <h1>Money Manager</h1>
        <div className="row">
          <button onClick={exportData}>Export</button>
          <button onClick={() => fileRef.current?.click()}>Import</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => importData(e.target.files?.[0])} />
        </div>
      </header>
      <p className="tagline">Know where your money is, where it's going, and what you can afford.</p>
      {message && <p role="status" className="message">{message}</p>}

      <label className="balance">
        Starting balance (RWF)
        <input
          aria-label="Starting balance"
          type="number"
          step="1"
          value={state.startingBalance || ''}
          placeholder="0"
          onChange={(e) => setState((p) => ({ ...p, startingBalance: parseFloat(e.target.value) || 0 }))}
        />
      </label>

      <section className="cards">
        <Card label="Available now" value={s.available} hint="Received − paid − saved" />
        <Card label="Forecast" value={s.forecast} hint="After expected income & planned expenses" />
        <Card label="Safe to spend" value={s.safeToSpend} hint="Won't break your plans" accent />
        <Card label="Saved for goals" value={s.allocated} hint="Allocated to goals" />
      </section>

      <section className="afford">
        <h2>Can I afford this?</h2>
        <input
          aria-label="Amount to check"
          type="number"
          min="0"
          step="1"
          placeholder="Amount in RWF"
          value={checkAmount}
          onChange={(e) => setCheckAmount(e.target.value)}
        />
        {afford && (
          <p data-testid="afford-result" className={`afford-${afford.verdict}`}>
            {afford.verdict === 'yes' && `Yes. You would still have ${money(afford.remainingSafe)} safe to spend.`}
            {afford.verdict === 'risky' &&
              `Risky. You have the money now, but your balance would go negative${afford.shortMonth ? ` in ${monthLabel(afford.shortMonth)}` : ''}.`}
            {afford.verdict === 'no' && `No. You only have ${money(s.available)} available now.`}
          </p>
        )}
      </section>

      <section className="timeline">
        <h2>Next 6 months</h2>
        {shortfall ? (
          <p role="alert" className="message">You would run short in {monthLabel(shortfall.month)}.</p>
        ) : (
          <p className="ok">No shortfall expected in the next 6 months.</p>
        )}
        <table>
          <thead>
            <tr><th>Month</th><th>Income</th><th>Expenses</th><th>Balance</th></tr>
          </thead>
          <tbody>
            {timeline.map((r) => (
              <tr key={r.month}>
                <td>{monthLabel(r.month)}</td>
                <td className="pos">{money(r.income)}</td>
                <td className="neg">{money(r.expenses)}</td>
                <td className={r.endBalance < 0 ? 'neg' : ''}><b>{money(r.endBalance)}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid">
        <section>
          <h2>Income</h2>
          <form onSubmit={submitIncome}>
            <input aria-label="Income source" placeholder="Source" value={inc.name} onChange={(e) => setInc({ ...inc, name: e.target.value })} />
            <input aria-label="Income amount" type="number" min="0" step="1" placeholder="Amount" value={inc.amount} onChange={(e) => setInc({ ...inc, amount: e.target.value })} />
            <input aria-label="Income date" type="date" value={inc.date} onChange={(e) => setInc({ ...inc, date: e.target.value })} />
            <label className="check">
              <input type="checkbox" checked={inc.received} onChange={(e) => setInc({ ...inc, received: e.target.checked })} />
              Received
            </label>
            <button>{editInc ? 'Save' : 'Add'}</button>
            {editInc && <button type="button" className="ghost" onClick={() => { setEditInc(null); setInc(emptyInc()) }}>Cancel</button>}
          </form>
          <ul>
            {sortByDate(state.incomes).map((i) => (
              <li key={i.id} className={i.received ? 'done' : ''}>
                <label className="check">
                  <input
                    type="checkbox"
                    aria-label={`Received: ${i.name}`}
                    checked={i.received}
                    onChange={() =>
                      setState((p) => ({ ...p, incomes: p.incomes.map((x) => (x.id === i.id ? { ...x, received: !x.received } : x)) }))
                    }
                  />
                  <span>{i.name}</span>
                </label>
                <small>{i.date}{i.received ? '' : ' · expected'}</small>
                <b className="pos">{money(i.amount)}</b>
                <span>
                  <button className="x" aria-label={`Edit ${i.name}`} onClick={() => startEditIncome(i)}>✎</button>
                  <button className="x" aria-label={`Delete ${i.name}`} onClick={() => setState((p) => ({ ...p, incomes: p.incomes.filter((x) => x.id !== i.id) }))}>×</button>
                </span>
              </li>
            ))}
            {!state.incomes.length && <li className="empty">No income yet.</li>}
          </ul>
        </section>

        <section>
          <h2>Planned expenses</h2>
          <form onSubmit={submitExpense}>
            <input aria-label="Expense name" placeholder="Expense" value={exp.name} onChange={(e) => setExp({ ...exp, name: e.target.value })} />
            <input aria-label="Expense amount" type="number" min="0" step="1" placeholder="Amount" value={exp.amount} onChange={(e) => setExp({ ...exp, amount: e.target.value })} />
            <select aria-label="Expense category" value={exp.category} onChange={(e) => setExp({ ...exp, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input aria-label="Expense date" type="date" value={exp.date} onChange={(e) => setExp({ ...exp, date: e.target.value })} />
            <button>{editExp ? 'Save' : 'Add'}</button>
            {editExp && <button type="button" className="ghost" onClick={() => { setEditExp(null); setExp(emptyExp()) }}>Cancel</button>}
          </form>
          <ul>
            {sortByDate(state.expenses).map((x) => (
              <li key={x.id} className={x.paid ? 'done' : ''}>
                <label className="check">
                  <input
                    type="checkbox"
                    aria-label={`Paid: ${x.name}`}
                    checked={x.paid}
                    onChange={() =>
                      setState((p) => ({ ...p, expenses: p.expenses.map((y) => (y.id === x.id ? { ...y, paid: !y.paid } : y)) }))
                    }
                  />
                  <span>{x.name}</span>
                </label>
                <small>{x.category} · {x.date}{x.paid ? '' : ' · planned'}</small>
                <b className="neg">{money(x.amount)}</b>
                <span>
                  <button className="x" aria-label={`Edit ${x.name}`} onClick={() => startEditExpense(x)}>✎</button>
                  <button className="x" aria-label={`Delete ${x.name}`} onClick={() => setState((p) => ({ ...p, expenses: p.expenses.filter((y) => y.id !== x.id) }))}>×</button>
                </span>
              </li>
            ))}
            {!state.expenses.length && <li className="empty">No expenses yet.</li>}
          </ul>
        </section>

        <section className="wide">
          <h2>Recurring items</h2>
          <form onSubmit={addRecurring}>
            <select aria-label="Recurring type" value={rec.kind} onChange={(e) => setRec({ ...rec, kind: e.target.value as 'income' | 'expense' })}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <input aria-label="Recurring name" placeholder="Name (e.g. Rent)" value={rec.name} onChange={(e) => setRec({ ...rec, name: e.target.value })} />
            <input aria-label="Recurring amount" type="number" min="0" step="1" placeholder="Amount" value={rec.amount} onChange={(e) => setRec({ ...rec, amount: e.target.value })} />
            {rec.kind === 'expense' && (
              <select aria-label="Recurring category" value={rec.category} onChange={(e) => setRec({ ...rec, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            )}
            <input aria-label="Day of month" type="number" min="1" max="31" placeholder="Day" value={rec.day} onChange={(e) => setRec({ ...rec, day: e.target.value })} />
            <button>Add rule</button>
          </form>
          <ul>
            {state.recurring.map((r) => (
              <li key={r.id}>
                <span>{r.name}</span>
                <small>{r.kind === 'income' ? 'Income' : r.category} · monthly on day {r.dayOfMonth}</small>
                <b className={r.kind === 'income' ? 'pos' : 'neg'}>{money(r.amount)}</b>
                <button className="x" aria-label={`Delete rule ${r.name}`} onClick={() => setState((p) => ({ ...p, recurring: p.recurring.filter((x) => x.id !== r.id) }))}>×</button>
              </li>
            ))}
            {!state.recurring.length && <li className="empty">No recurring items yet.</li>}
          </ul>
          {!!state.recurring.length && <button onClick={generateNext}>Generate next 3 months</button>}
        </section>

        <section className="wide">
          <h2>Savings goals</h2>
          <form onSubmit={submitGoal}>
            <input aria-label="Goal name" placeholder="Goal (e.g. Laptop)" value={goal.name} onChange={(e) => setGoal({ ...goal, name: e.target.value })} />
            <input aria-label="Goal target" type="number" min="0" step="1" placeholder="Target" value={goal.target} onChange={(e) => setGoal({ ...goal, target: e.target.value })} />
            <input aria-label="Goal deadline" type="date" value={goal.deadline} onChange={(e) => setGoal({ ...goal, deadline: e.target.value })} />
            <button>{editGoal ? 'Save' : 'Add'}</button>
            {editGoal && <button type="button" className="ghost" onClick={() => { setEditGoal(null); setGoal(emptyGoal()) }}>Cancel</button>}
          </form>
          <div className="goals">
            {state.goals.map((g) => (
              <div key={g.id} className="goal">
                <div className="row">
                  <b>{g.name}</b>
                  <span>
                    <button className="x" aria-label={`Edit ${g.name}`} onClick={() => startEditGoal(g)}>✎</button>
                    <button className="x" aria-label={`Delete ${g.name}`} onClick={() => setState((p) => ({ ...p, goals: p.goals.filter((x) => x.id !== g.id) }))}>×</button>
                  </span>
                </div>
                <div className="bar"><div style={{ width: `${(g.saved / g.target) * 100}%` }} /></div>
                <small>{money(g.saved)} of {money(g.target)}</small>
                <GoalPlanLine goal={g} />
                <div className="row">
                  <button onClick={() => contribute(g.id, -1000)}>−1000</button>
                  <button onClick={() => contribute(g.id, 1000)}>+1000</button>
                  <button onClick={() => contribute(g.id, 5000)}>+5000</button>
                </div>
              </div>
            ))}
            {!state.goals.length && <p className="empty">No goals yet.</p>}
          </div>
        </section>
      </div>
    </main>
  )
}

function GoalPlanLine({ goal }: { goal: Goal }) {
  const plan = planGoal(goal, today().slice(0, 7))
  if (!plan) return null
  if (plan.remaining === 0) return <small className="ok">Goal reached</small>
  if (plan.overdue) return <small className="neg">Overdue · {money(plan.remaining)} still missing</small>
  return (
    <small>
      Due {monthLabel(goal.deadline!.slice(0, 7))} · save {money(plan.perMonth)}/month
    </small>
  )
}

function Card({ label, value, hint, accent }: { label: string; value: number; hint: string; accent?: boolean }) {
  return (
    <div className={`card${accent ? ' accent' : ''}`}>
      <small>{label}</small>
      <strong className={value < 0 ? 'neg' : ''}>{money(value)}</strong>
      <small>{hint}</small>
    </div>
  )
}
