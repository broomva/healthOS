---



title: "Remove deprecated DB schema tables messageDeprecated and voteDeprecated"
identifier: "HOS-14"
id: "HOS-14"
state: done
priority: 1
project: "healthOS"
updated_at: "2026-03-24T00:35:44.396019+00:00"
---

# HOS-14: Remove deprecated DB schema tables

`lib/db/schema.ts` contains two deprecated table definitions — `messageDeprecated` and `voteDeprecated` — that are marked as DEPRECATED but still exist in the codebase. These add confusion and dead weight.

## What to do

1. Read `lib/db/schema.ts` and find the deprecated tables
2. Search the entire codebase for any remaining references to `messageDeprecated` or `voteDeprecated`:
   ```bash
   grep -r "messageDeprecated\|voteDeprecated" --include="*.ts" --include="*.tsx" .
   ```
3. If any references exist outside schema.ts, update them to use the current tables
4. Remove the deprecated table definitions from schema.ts
5. Run `bunx tsc --noEmit` and `bunx biome check .` to verify clean
6. Do NOT run `bun run db:push` or `bun run db:migrate` — schema changes to deployed DB require careful migration

## Acceptance Criteria
- `grep -r "messageDeprecated\|voteDeprecated" .` returns no results (except possibly migration files)
- `bunx tsc --noEmit` passes
- `bunx biome check .` passes
