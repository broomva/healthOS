---

title: "Replace console.log in chat route with structured logger"
identifier: "HOS-18"
id: "HOS-18"
state: todo
priority: 2
project: "healthOS"
updated_at: "2026-03-24T00:00:00.000000+00:00"
---

# HOS-18: Replace console.log in chat route with structured logger

`app/(chat)/api/chat/route.ts` has raw `console.log` and `console.error` calls (lines ~75-79). The project already has a structured logger at `lib/observability/logger.ts`. Use it instead.

## What to do

1. Read `lib/observability/logger.ts` to understand the logger API
2. Read `app/(chat)/api/chat/route.ts` and find the console.log/console.error calls
3. Import the logger and replace each console call with the structured equivalent:
   - `console.log(...)` → `logger.info(...)`
   - `console.error(...)` → `logger.error(...)`
4. Pass structured context objects where useful (e.g., `{ chatId, model }`)
5. Run `bunx tsc --noEmit` and `bunx biome check .`

## Acceptance Criteria
- No `console.log` or `console.error` in `app/(chat)/api/chat/route.ts`
- Replaced with structured logger calls
- TypeScript and biome pass clean
