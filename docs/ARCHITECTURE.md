# SubTrack — Architecture

## Overview
Single Next.js (App Router) app. Server Components read data; Server Actions mutate it.
A thin REST layer under `src/app/api/` exists only for export and future mobile use.

```
Browser ──► Next.js App Router
             ├─ Server Components ──► src/server/repo/*  ──► Prisma ──► SQLite (dev) / Postgres (prod)
             ├─ Server Actions    ──► zod validate ──► src/server/services/* ──► src/lib/* (pure logic)
             └─ /api/export       ──► same services
```

## Layers (dependency direction: top → bottom only)
| Layer | Path | Rule |
|---|---|---|
| UI | `src/app/**`, `src/components/**` | No Prisma imports. Calls Server Actions. |
| Actions / routes | `src/app/**/actions.ts`, `src/app/api/**` | Validate input with Zod, call services. |
| Services | `src/server/services/` | Business workflows (log payment → advance renewal). |
| Repositories | `src/server/repo/` | The only code that touches Prisma. |
| Domain | `src/lib/` | Pure functions (billing, money, dates). No I/O, 100% unit tested. |

## Architecture decisions (ADR log)
- **ADR-1 Next.js full-stack, not separate API.** One user, one deploy; Server Actions remove an API boundary we do not need.
- **ADR-2 SQLite via Prisma for dev.** Zero-setup local DB; Prisma lets us switch to Postgres by changing `provider`.
- **ADR-3 Integer cents.** Avoid float rounding bugs (`0.1 + 0.2`). Formatting happens only at the UI edge.
- **ADR-4 Pure domain module.** Date and money logic lives in `src/lib` so it is fast to test and impossible to couple to the DB.
- **ADR-5 No payment processing.** We only record payments; this removes PCI scope entirely.
- **ADR-6 String enums in DB, Zod enums in code.** SQLite has no native enums; Zod is the source of truth for allowed values.
