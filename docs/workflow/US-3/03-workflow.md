# US-3 · Workflow record

How US-3 (spend dashboard) went from question to merged code. Each phase has a git tag;
`git log --oneline --decorate us3-explore~1..` shows the whole sequence.

| Phase | Tag | Artifact |
|---|---|---|
| 0. Setup | — | `ce28ebc chore: scaffold …` (project tooling, not US-3) |
| 1. Explore | `us3-explore` | [01-explore.md](01-explore.md): docs read, repo state, 4 doc conflicts, 2 decisions |
| 2. Plan | `us3-plan` | [02-plan.md](02-plan.md): the plan approved in plan mode, 12 TDD-ordered steps |
| 3. Implement | `us3-implement` | Red commit, then green layer by layer (below) |
| 4. Acceptance + refactor | `us3-refactor` | AC-3.1…AC-3.8 in `docs/PRD.md`, then per criterion: test the gap → green → refactor |
| 5. Plan check | — | Every plan item re-verified against the code; one gap fixed |

## Phase 3: Implement (strict TDD)

| Commit | Step | Tests |
|---|---|---|
| `17c7550` test: US-3 failing tests (red) | Schema + migration, seed, domain types, **95 tests**, every US-3 function stubbed to throw `Not implemented` | 92 failing, each in its own feature; 3 pin value lists |
| `98f7528` feat: money, cost normalization and effective status | Plan steps 1–3 | money 13/13, billing 19/19, status 8/8 |
| `5155be0` feat: spend summary domain logic | Plan step 4 | summary 25/25, `src/lib` 100% lines |
| `b036727` feat: summary service and GET /api/summary | Plan steps 6–9 | service 5/5 (real test DB), route 4/4 |
| `fdde224` feat: spend dashboard page (US-3) | Plan step 10 | components 15/15, page 3/3 |
| `047bec6` docs: mark US-3 done and record the TDD restart | Plan step 12 | 95/95 |

## Phase 4: Acceptance criteria and refactor

`6e1937a` adds AC-3.1…AC-3.8. Then, for each criterion: check its tests, close any gap, refactor.
Tests for behavior that already existed were each proven by a **deliberate break**: the code was changed
so the test should fail, the failure was watched, and the code was restored.

| Commit | AC | What |
|---|---|---|
| `b1f79fb` | 3.1, 3.2 | refactor: one cycle-ratio table instead of two parallel switches |
| `25a4cc1` | 3.2 | test: category yearly totals add up to the per-cycle yearly total |
| `b6cf43b` | 3.3 | refactor: BR-8 rule named `spendBucket` |
| `4049884` | 3.4 | test: filtering to a currency with no spend → `[]`; refactor: filter before summarizing |
| `6a6970b` | 3.5 | test: API returns every category; refactor: shared `groupBy` |
| `1f57ccb` | 3.6 | refactor: shared test fixtures |
| `2925d34` | 3.7 | **bug fix, red → green**: top entries carry `id`; same-named subscriptions get distinct keys |
| `d3821c9` | 3.8 | test: page and API render per request (`force-dynamic`) |
| `0f64b61` | — | docs: AC → test mapping |

## Phase 5: Plan check
| Commit | What |
|---|---|
| `5dd7e70` | The plan promised a compile-time check that the Zod enums equal the domain types, and it was missing. Added it, proven by a deliberate break. |
| `459c5e4` | Test count in PROGRESS.md (105) |

Verification at the end: `npm run check` passes 105/105, `src/lib` has 100% line coverage, `next build` is clean,
and 14 live checks against the seed data pass (totals match hand-computed values).

## Where execution differed from the plan
1. **A first attempt was test-after.** The first build of US-3 wrote the `src/lib` tests first, but they failed
   only with "module not found", and the service, route and UI were written before their tests. A
   review caught this, so that build was set aside (it isn't in this history) and US-3 was redone
   from `17c7550`: stubs plus the full test suite red, then green one layer at a time.
2. **Top entries carry `id`** (AC-3.7). This wasn't in the plan; it came from writing the acceptance criteria.
3. **The enum compile-time check** was in the plan but was missed until the plan check (`5dd7e70`).
4. **The seed** runs with Node's built-in TypeScript support instead of adding a `tsx` dependency.
5. **Commit grouping** follows the TDD sequence rather than the plan's suggested six commits.

## Commands used
```bash
npx vitest run src/lib/<file>.test.ts        # narrowest test while iterating
npx vitest run src/lib --coverage            # 100% line coverage of src/lib
npm run check                                # typecheck + lint + all tests
npm run db:migrate -- --name add_subscriptions
npx prisma db seed                           # fake data; skips if data exists
npx next build && npx next start -p 3123     # live checks with curl against /api/summary and /
```

## Note on dates
The explore and plan records (`us3-explore`, `us3-plan`) were committed after the fact, from the session,
and placed in workflow order. Their commit dates are the real dates they were written, not backdated.
