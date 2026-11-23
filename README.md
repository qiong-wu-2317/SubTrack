# SubTrack

A single-user personal subscription manager. It tracks each subscription's price, billing cycle, fees,
payment method, renewal, trial end and expiration, and shows monthly and yearly spend.
**SubTrack records payments; it never makes them.**

Built with Claude Code using an **Explore → Plan → Implement → Commit** workflow and strict TDD.

| Deliverable | Where |
|---|---|
| 1. Claude Code configuration | [`CLAUDE.md`](CLAUDE.md) · [`.claude/settings.json`](.claude/settings.json) (permissions) · [policy and rationale](docs/claude-setup/PERMISSIONS.md) |
| 2. Feature code with TDD git history (red → green → refactor) | [US-3 spend dashboard](#1-feature-us-3-spend-dashboard) · tags `us3-explore` → `us3-refactor` |
| 3. Annotated Claude Code session log | [`docs/claude-setup/SESSION_LOG.md`](docs/claude-setup/SESSION_LOG.md) |
| 4. Reflection document | [`docs/claude-setup/REFLECTION.md`](docs/claude-setup/REFLECTION.md) |

---

## 1. Feature: US-3 spend dashboard

> **US-3** · "I see a dashboard: total monthly spend, yearly spend, spend by category." ([PRD](docs/PRD.md))

`/` shows one card per currency (amounts are never summed across currencies). Each card has the monthly
and yearly totals, the active count, trials shown separately with their cost after the trial, a
spend-by-category breakdown (at most 5 rows, the rest rolled into `other`), and the 3 most expensive
subscriptions. The same data is served by `GET /api/summary?currency=USD`.

| Layer | Code | Tests |
|---|---|---|
| Domain (pure) | [`src/lib/`](src/lib/): `money`, `billing`, `status`, `summary` | unit, **100% line coverage**, every business rule has a named test (`it("BR-8: …")`) |
| Server | [`src/server/`](src/server/): Zod schemas, repo, `getSpendSummary` | integration tests against a throwaway SQLite DB |
| API | [`src/app/api/summary/route.ts`](src/app/api/summary/route.ts) | validation, 400 / 500 error format, never cached |
| UI | [`src/app/page.tsx`](src/app/page.tsx), [`src/components/`](src/components/) | rendered with `react-dom/server` |

**105 tests**, all passing. Acceptance criteria **AC-3.1…AC-3.8** are in [`docs/PRD.md`](docs/PRD.md), each mapped to its tests.

### TDD git history

The history reads in workflow order, and each phase has a git tag:

```bash
git log --oneline --decorate us3-explore~1..us3-refactor   # explore → plan → red → green
git log --oneline us3-refactor~1..main                     # acceptance criteria + refactor
```

| Phase | Commit | What | Tests |
|---|---|---|---|
| Explore | [`e284418`](https://github.com/qiong-wu-2317/SubTrack/commit/e284418) `us3-explore` | Docs read, repo state, 4 doc conflicts, 2 decisions → [01-explore.md](docs/workflow/US-3/01-explore.md) | — |
| Plan | [`4398de2`](https://github.com/qiong-wu-2317/SubTrack/commit/4398de2) `us3-plan` | Plan approved in plan mode, 12 TDD-ordered steps → [02-plan.md](docs/workflow/US-3/02-plan.md) | — |
| 🔴 **Red** | [`17c7550`](https://github.com/qiong-wu-2317/SubTrack/commit/17c7550) `us3-implement` | 95 tests; every US-3 function stubbed to throw `Not implemented` | **92 failing**, each in its own feature |
| 🟢 Green | [`98f7528`](https://github.com/qiong-wu-2317/SubTrack/commit/98f7528) | money, cost normalization, effective status | money 13 · billing 19 · status 8 |
| 🟢 Green | [`5155be0`](https://github.com/qiong-wu-2317/SubTrack/commit/5155be0) | spend summary domain logic | summary 25 · `src/lib` 100% |
| 🟢 Green | [`b036727`](https://github.com/qiong-wu-2317/SubTrack/commit/b036727) | summary service + `GET /api/summary` | service 5 (real DB) · route 4 |
| 🟢 Green | [`fdde224`](https://github.com/qiong-wu-2317/SubTrack/commit/fdde224) | dashboard page + components | components 15 · page 3 → **95/95** |
| Criteria | [`6e1937a`](https://github.com/qiong-wu-2317/SubTrack/commit/6e1937a) `us3-refactor` | AC-3.1…AC-3.8 written into the PRD | — |
| 🔵 Refactor | [`b1f79fb`](https://github.com/qiong-wu-2317/SubTrack/commit/b1f79fb) | one cycle-ratio table instead of two switches (AC-3.1/3.2) | green |
| 🔵 Refactor | [`b6cf43b`](https://github.com/qiong-wu-2317/SubTrack/commit/b6cf43b) | BR-8 rule named `spendBucket` (AC-3.3) | green |
| 🔵 Test + refactor | [`4049884`](https://github.com/qiong-wu-2317/SubTrack/commit/4049884) · [`6a6970b`](https://github.com/qiong-wu-2317/SubTrack/commit/6a6970b) | gap tests (AC-3.4, 3.5); filter before summarizing; shared `groupBy` | green |
| 🔵 Refactor | [`1f57ccb`](https://github.com/qiong-wu-2317/SubTrack/commit/1f57ccb) | shared test fixtures (AC-3.6) | green |
| 🔴→🟢 Bug fix | [`2925d34`](https://github.com/qiong-wu-2317/SubTrack/commit/2925d34) | same-named subscriptions shared a React key (AC-3.7): failing test first, then the fix | green |
| 🔵 Test + refactor | [`d3821c9`](https://github.com/qiong-wu-2317/SubTrack/commit/d3821c9) · [`5dd7e70`](https://github.com/qiong-wu-2317/SubTrack/commit/5dd7e70) | per-request rendering (AC-3.8); Zod ↔ domain type check | **105/105** |

Two notes on how this history should be read:
- **Proving tests written after the code.** Gap tests for behavior that already existed pass immediately,
  so each was proven by a **deliberate break**: change the code so the test should fail, watch it fail,
  restore the code.
- **What isn't in this history.** A first attempt at US-3 wasn't strictly test-first, so it was set aside
  and redone from the red commit. That first attempt isn't in this history. The explore and plan records
  were written up from the session and placed in workflow order, with their real dates. See
  [03-workflow.md](docs/workflow/US-3/03-workflow.md).

---

## 2. Annotated Claude Code session log

[`docs/claude-setup/SESSION_LOG.md`](docs/claude-setup/SESSION_LOG.md) has one entry for each of the
session's 16 prompts. Each entry gives the **verbatim prompt** with its time, **what happened**, a
**📝 annotation** (why it was done that way, the lesson or caveat) and the **evidence** (commit, tag,
PR or file). It ends with lessons, a table of mistakes and how each was caught, and the guardrails that held.

---

## 3. Reflection

[`docs/claude-setup/REFLECTION.md`](docs/claude-setup/REFLECTION.md) answers:
1. How does the Explore → Plan → Implement → Commit workflow compare to my previous approach
   (VS Code + GitHub Copilot)?
2. Which context management strategies worked best?

---

## 4. Claude Code configuration

### [`CLAUDE.md`](CLAUDE.md): project memory
Loaded automatically at the start of every Claude Code session. It started from `/init` and was then
edited by hand.

| Section | What it gives Claude |
|---|---|
| Project context | What SubTrack is and isn't (records payments, never makes them), plus `@`-imports of [`PRD.md`](docs/PRD.md), [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`API.md`](docs/API.md), so requirements, ADRs and the API contract are in context from the first prompt |
| Tech stack | Pinned choices (Next.js 15, Prisma 6, Zod 4, …) and "ask before adding a dependency" |
| Commands | `npm run check`, single-file and single-test runs, migrations, seed; plus setup state, the test DB and lint-enforced layering |
| Architecture rules | UI → actions/routes → services → repo → Prisma; only `src/server/repo` imports Prisma (enforced by ESLint) |
| Coding conventions | Integer `Cents` money, `…At` / `…Date` naming, `now` passed in, Conventional Commits, comments citing rule IDs |
| Testing strategy | TDD for domain logic, the test pyramid, deterministic time, 100% `src/lib` coverage, a named test per business rule |
| Do's / Don'ts | Plan mode for multi-file or schema changes, reuse existing helpers, no floats for money, never read `.env`, no push or history rewrite unless asked |

`CLAUDE.local.md` (gitignored) holds personal, uncommitted preferences.

### [`.claude/settings.json`](.claude/settings.json): permissions
Committed and shared, so every session gets the same rules. The reason for each rule is in
[`PERMISSIONS.md`](docs/claude-setup/PERMISSIONS.md).

| Tier | Effect | Rules |
|---|---|---|
| **allow** (13) | Runs without a prompt | the dev loop: `npm run check` / `test:coverage` / `test:e2e` / `dev`, `npx vitest`, `npx tsc --noEmit`, `npx eslint`, `prisma generate`, read-only git |
| **ask** (9) | Prompts every time | `git add` / `commit`, `npm install` / `uninstall`, migrations, `WebFetch` / `WebSearch` |
| **deny** (10) | Blocked | reading `.env`, `prisma migrate reset`, `db push --force-reset`, deleting `prisma/migrations`, `git push` / `rebase` / `reset --hard` / `commit --amend` |

Deny wins over ask, and ask wins over allow. Personal overrides go in `.claude/settings.local.json` (gitignored).
Bash rules match command prefixes, so they're a guardrail, not a security boundary
(see [Limits](docs/claude-setup/PERMISSIONS.md#limits)).

---

## Getting started

Requires Node ≥ 22 and npm.

```bash
cp .env.example .env
npm install
npm run db:migrate          # create the SQLite dev database
npx prisma db seed          # fake demo data (USD + EUR); skips if data exists
npm run dev                 # http://localhost:3000
```

| Command | Purpose |
|---|---|
| `npm run check` | typecheck + lint + all tests (must pass before "done") |
| `npm run test:coverage` | enforces 100% line coverage of `src/lib` |
| `npx vitest run src/lib/billing.test.ts` | run one test file |
| `npm run test:e2e` | Playwright (run `npx playwright install chromium` once first) |

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript (strict) · Prisma 6 + SQLite · Zod 4 ·
date-fns 4 · Tailwind 4 · Vitest · Playwright

## Project docs
- [`docs/PRD.md`](docs/PRD.md): user stories, business rules BR-1…BR-10, US-3 acceptance criteria
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): layers and ADRs
- [`docs/API.md`](docs/API.md): Server Actions, REST routes, error format
- [`docs/PROGRESS.md`](docs/PROGRESS.md): what's done, what's next, open questions
