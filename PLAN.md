# Money Manager: Implementation Plan

Goal: know where your money is, where it's going, and what you can afford. Web app, data stored locally, currency RWF.

Working rules
- Finish and verify each phase (`npm test` and `npm run build` pass) before starting the next.
- Keep the safe-to-spend logic in `src/lib/finance.ts`, covered by tests, with no UI logic mixed in.
- Add features only when they are in this plan. Ask before changing scope.

## Phase 0: Verify the foundation (current)
Code written, not yet run.
- [x] Install test tooling (vitest, jsdom, testing-library) and add a `test` script
- [x] `npm test` passes (finance, backup parsing, App tests)
- [x] `npm run build` passes
- [x] Open the app in a browser: add, edit, delete, toggle, export, import; check the phone layout
- [x] Fix whatever breaks
- [ ] `git init` and make the first commit

Done when: tests and build are green and the manual browser check finds no bugs.

## Phase 1: Forecasting
- [x] Add a starting balance so "available" matches your real balance (written, awaiting test and build run)
- [ ] Recurring income and expenses (monthly), generated into dated entries
- [ ] Month-by-month timeline showing the projected balance and where it goes negative
- [ ] Goal deadlines with a suggested monthly contribution
- [ ] Tests for recurrence and timeline calculations

Done when: you can see, for each upcoming month, the projected balance and whether you run short.

## Phase 2: Decision support
- [ ] "Can I afford this?" check: enter an amount and see the effect on the forecast
- [ ] Spending by category
- [ ] Warning when planned expenses exceed expected income
- [ ] Custom categories

Done when: you can answer "can I spend X on Y?" without doing math.

## Phase 3: Polish
- [ ] Mobile-first layout pass
- [ ] Installable PWA with offline support
- [ ] Dark mode
- [ ] Accessibility pass (labels, keyboard use, contrast)

## Phase 4: Only if needed
- [ ] Sync across devices (cloud backend and login)
- [ ] Import from mobile money or bank statements

## Open questions
- Mobile money (MTN or Airtel) or bank as the main account?
- Phone, laptop, or both as the main device?
- Should multiple accounts or wallets be tracked separately?
