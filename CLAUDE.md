# CLAUDE.md — SubTrack

Guidance for Claude Code in this repository. Started from `/init` output
(snapshot: `docs/claude-setup/CLAUDE.init-v0.md`), then edited by hand. The changes
are listed in `docs/claude-setup/ITERATION_LOG.md`.

## Project context

SubTrack is a **single-user personal subscription manager**. It tracks every
subscription's price, billing cycle, fees, payment method, next renewal, trial end
and expiration, and shows monthly and yearly spend.

**SubTrack records payments. It never makes them.** It has no payment processing,
no bank or card-network connections, and no full card numbers.

Detailed context is imported below. Treat these files as the source of truth. If
code and docs disagree, follow the docs and point out the mismatch.

- Product requirements, user stories US-1…US-8, business rules BR-1…BR-7: @docs/PRD.md
- Layers and architecture decisions (ADR-1…ADR-6): @docs/ARCHITECTURE.md
- Server Actions, REST routes, error shape: @docs/API.md
- How to manage context across sessions: @docs/claude-setup/CONTEXT_STRATEGY.md

## Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Runtime | Node ≥ 22, npm | No yarn or pnpm. Commit `package-lock.json`. |
| Framework | Next.js 15 App Router, React 19 | Server Components by default. Use `"use client"` only where interactivity needs it. |
| Language | TypeScript 5, `strict` + `noUncheckedIndexedAccess` | No `any`. Use `unknown` and narrow it. |
| Data | Prisma 6. SQLite in dev, Postgres-ready | Schema in `prisma/schema.prisma` |
| Validation | Zod 4 | Single source of truth for enums and inputs (`src/server/schemas.ts`) |
| Dates | date-fns 4 | Never do date math with raw milliseconds |
| Styling | Tailwind CSS 4 | No CSS-in-JS. No component library without asking first. |
| Tests | Vitest (unit/integration), Playwright (e2e) | |

Don't add a dependency without asking first. Say why it's needed and check that it's maintained.

## Commands

```bash
npm run dev                                   # start app on :3000
npm run check                                 # typecheck + lint + unit tests. MUST pass before "done"
npx vitest run src/lib/billing.test.ts        # one file (prefer this while iterating)
npx vitest run -t "clamps month-end dates"    # one test by name
npm run test:e2e                              # Playwright, specs in tests/e2e/
npm run db:migrate -- --name <change>         # after editing schema.prisma
npm run db:generate                           # regenerate Prisma client
```

**Scaffold state:** these paths are planned but don't exist yet:
`src/server/{schemas.ts,services/,repo/}`, `src/app/api/`, `src/components/`,
`prisma/seed.ts`, and the eslint/vitest/playwright configs. Create them where
`docs/ARCHITECTURE.md` places them. Don't invent a new layout.

## Architecture rules (summary)

- Dependencies only point downward: **UI → actions/routes → services → repo → Prisma**. `src/lib/` holds pure domain code that any layer may import.
- **Only `src/server/repo/**` imports `@prisma/client`.**
- `src/server/**` is server-only. Add `import "server-only"` at the top and never import it from a client component.
- Every Server Action and route validates input with Zod **before** calling a service.
- Errors use `{ error: { code, message, fields? } }` (see API.md). Never leak stack traces to the client.

## Coding conventions

- **Money:** use the `Cents` type and integer math only. Round once, at the end. `formatCents` is the only place that divides by 100. Field names end in `Cents` (`amountCents`).
- **Dates:** store UTC `Date`. Name date fields with an `At` suffix for instants (`paidAt`) and a `Date` suffix for calendar days (`startDate`). Functions that need "now" take a `now: Date` parameter. Never call `new Date()` inside domain logic.
- **Naming:** files are `kebab-case.ts`, React components are `PascalCase.tsx`, functions are `camelCase` verbs (`advanceRenewal`), Zod schemas are `PascalCase` + `Schema` (`SubscriptionInputSchema`), and inferred types drop the suffix.
- **Functions:** keep them small and pure where possible. Return early instead of nesting. No default exports except Next.js pages/layouts.
- **Imports:** use the `@/` alias for anything outside the current folder. No barrel `index.ts` files.
- **Comments:** explain *why*, not *what*. Reference rule IDs (`// BR-3: clamp month end`).
- **Commits:** use Conventional Commits (`feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`). Keep them small and focused, one logical change each.

## Testing strategy

- **TDD for domain logic.** Write the failing test in `src/lib/*.test.ts` first, then implement.
- **Pyramid:**
  1. **Unit** (`src/lib/**/*.test.ts`): pure functions, every business rule BR-1…BR-7, and edge cases (Jan 31 → Feb 28, leap years, custom intervals, rounding).
  2. **Integration** (`src/server/**/*.test.ts`): services + repo against a throwaway SQLite DB (`DATABASE_URL=file:./test.db`), reset per file.
  3. **E2E** (`tests/e2e/*.spec.ts`): only the critical flows. Add a subscription, log a payment and see the renewal advance, see an upcoming-expiry warning.
- **Deterministic time:** pass a fixed `now` or use `vi.useFakeTimers()` with `vi.setSystemTime(...)`. Tests must never depend on today's date.
- **Coverage target:** 100% of `src/lib/` lines, and every business rule has at least one named test (`it("BR-4: expired is terminal", ...)`).
- A bug fix starts with a regression test that reproduces it.
- Never delete or weaken a failing test to make the suite pass. Fix the code, or ask.

## Do's

- ✅ Read the relevant PRD rule or ADR before changing behavior, and cite it in the PR or commit.
- ✅ Use **plan mode** for any change touching more than 2 files or the Prisma schema.
- ✅ Run the narrowest test while iterating, then `npm run check` before reporting done. Report real output.
- ✅ Keep migrations additive. Name them (`--name add_trial_end`).
- ✅ Reuse `advanceRenewal`, `monthlyCostCents` and `formatCents` instead of re-deriving the math.
- ✅ Make confirmations explicit in the UI for destructive actions (delete cascades payments and fees).
- ✅ Update `docs/` in the same change when behavior or the API changes.

## Don'ts

- ❌ Never use floats for money (`19.99`), `parseFloat` on amounts, or `toFixed` for math.
- ❌ Never sum amounts across currencies (BR-6). Group by currency.
- ❌ Never store or log full card numbers, CVV, bank credentials or real personal data. `last4` holds at most 4 digits. Seed data is fake.
- ❌ Don't integrate payment providers (Stripe, Plaid, …) or send emails or SMS. Those are out of scope for v1 (PRD non-goals).
- ❌ Don't import Prisma outside `src/server/repo/`, and don't put business logic in components.
- ❌ Don't read, print or commit `.env`. Use `.env.example` for new variables.
- ❌ Don't run `prisma migrate reset`, `db push --force-reset`, or delete `prisma/migrations/` without asking.
- ❌ Don't `git push`, force-push, or rewrite history unless asked.
- ❌ Don't silence type errors with `// @ts-ignore` or `as any`.

## Working with Claude in this repo

- Track progress for multi-session features in `docs/PROGRESS.md`: what's done, what's next, open questions. Update it before `/clear`.
- Personal, uncommitted preferences go in `CLAUDE.local.md`, which is gitignored.
- Permissions are configured in `.claude/settings.json` (see `docs/claude-setup/PERMISSIONS.md`).
