---


title: "Fix password field length in DB schema - increase from 64 to 255 chars"
identifier: "HOS-15"
id: "HOS-15"
state: done
priority: 2
project: "healthOS"
updated_at: "2026-03-24T00:35:47.109824+00:00"
---

# HOS-15: Fix password field length in DB schema

The `user` table in `lib/db/schema.ts` stores passwords in `varchar("password", { length: 64 })`. bcrypt hashes are 60 characters but Argon2 and other modern hashing algorithms can produce longer outputs. A 64-char limit is too tight for forward compatibility and some edge cases.

## What to do

1. Read `lib/db/schema.ts` and find the password field definition
2. Change the password field length from 64 to 255:
   ```ts
   // before
   password: varchar("password", { length: 64 })
   // after
   password: varchar("password", { length: 255 })
   ```
3. Generate a new migration:
   ```bash
   bun run db:generate
   ```
4. Review the generated migration SQL to make sure it's just an ALTER COLUMN
5. Run `bunx tsc --noEmit` to verify types still pass

## Acceptance Criteria
- Password field is `varchar(255)` in schema.ts
- A new migration file exists in `lib/db/migrations/`
- `bunx tsc --noEmit` passes
- `bunx biome check .` passes
