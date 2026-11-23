# Claude Code permissions — SubTrack

`CLAUDE.md` points here. This file explains the permission policy for Claude Code in
this repo and why each rule exists. The rules themselves live in
`.claude/settings.json` (committed, shared). Personal overrides go in
`.claude/settings.local.json` (gitignored).

## Policy at a glance

| Tier | Meaning | Used for |
|---|---|---|
| **allow** | Runs without a prompt | Read-only inspection and the dev loop: tests, typecheck, lint, Prisma client generation |
| **ask** | Prompts every time | Changes that are hard to undo or that leave the machine: commits, new dependencies, migrations, network fetches |
| **deny** | Blocked | Actions `CLAUDE.md` forbids outright: reading `.env`, destructive DB resets, pushing or rewriting git history |

When several tiers match, deny wins over ask, and ask wins over allow.

## Rules and rationale

### Allow: the inner loop
The commands from `CLAUDE.md` § Commands that only read or verify:

- `npm run check`, `npm run dev`, `npm run test:coverage`, `npm run test:e2e`, `npx vitest …`, `npx tsc --noEmit`, `npx eslint …`
- `npm run db:generate` / `npx prisma generate`: regenerates the client and doesn't touch data
- Read-only git: `git status`, `git diff`, `git log`, `git show`

**Why:** `CLAUDE.md` says to run the narrowest test while iterating and `npm run check`
before reporting done. Prompting on every test run would make that loop impractical.

### Ask: reviewable but not routine

| Rule | Why |
|---|---|
| `git add`, `git commit` | Commits are small and focused, one logical change each (Conventional Commits). The user checks each one. The git root is the parent course repo `6983_AIcoding/`, so only stage paths under `SubTrack/`. |
| `npm install`, `npm uninstall`, `npm i` | "Don't add a dependency without asking first." |
| `npm run db:migrate`, `npx prisma migrate dev` | Schema changes need plan mode and must be additive and named (`--name add_trial_end`). |
| `WebFetch`, `WebSearch` | Sends data off the machine. |

### Deny: hard lines from `CLAUDE.md`

| Rule | Source in `CLAUDE.md` |
|---|---|
| `Read(./.env)`, `Read(./.env.local)`, `Read(./.env.*.local)` | "Don't read, print or commit `.env`." `.env.example` stays readable. |
| `npx prisma migrate reset`, `npx prisma db push --force-reset` | "Don't run `prisma migrate reset`, `db push --force-reset` … without asking." Denied rather than asked, so an approval can't be given by reflex. If the user really wants a reset, they run it themselves with `! <command>`. |
| `rm -rf prisma/migrations` | "Don't … delete `prisma/migrations/`." |
| `git push`, `git push --force`, `git rebase`, `git reset --hard`, `git commit --amend` | "Don't `git push`, force-push, or rewrite history unless asked." |

## `.claude/settings.json`

The active configuration, [`.claude/settings.json`](../../.claude/settings.json), is committed and reproduced here.
A rule like `Bash(git push *)` matches the command with any arguments, and the bare command too.

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(npm run check)",
      "Bash(npm run dev)",
      "Bash(npm run test:coverage)",
      "Bash(npm run test:e2e)",
      "Bash(npm run db:generate)",
      "Bash(npx vitest *)",
      "Bash(npx tsc --noEmit)",
      "Bash(npx eslint *)",
      "Bash(npx prisma generate)",
      "Bash(git status *)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git show *)"
    ],
    "ask": [
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(npm install *)",
      "Bash(npm i *)",
      "Bash(npm uninstall *)",
      "Bash(npm run db:migrate *)",
      "Bash(npx prisma migrate dev *)",
      "WebFetch",
      "WebSearch"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.local)",
      "Read(./.env.*.local)",
      "Bash(npx prisma migrate reset *)",
      "Bash(npx prisma db push --force-reset *)",
      "Bash(rm -rf prisma/migrations *)",
      "Bash(git push *)",
      "Bash(git rebase *)",
      "Bash(git reset --hard *)",
      "Bash(git commit --amend *)"
    ]
  }
}
```

## Limits

- Bash rules match command **prefixes**. A reworded command, such as `npm exec prisma migrate reset`
  or a command chained after `&&`, may not match a deny rule. Treat the deny list as a
  guardrail. The hard limits are still the instructions in `CLAUDE.md`. If you need
  stronger guarantees, add a `PreToolUse` hook that rejects these patterns.
- Some rules in `CLAUDE.md` can't be expressed as permissions: no payment-provider SDKs, no
  real card data, no floats for money. Code review and tests enforce those, not this file.

## Changing the policy

Edit `.claude/settings.json` and this file in the same commit (`chore: …`), and add a
line to `docs/claude-setup/ITERATION_LOG.md` saying what changed and why.
