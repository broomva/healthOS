---

title: "Standardize error handling across AI tool implementations"
identifier: "HOS-22"
id: "HOS-22"
state: todo
priority: 2
project: "healthOS"
updated_at: "2026-03-24T00:00:00.000000+00:00"
---

# HOS-22: Standardize error handling across AI tools

The tools in `lib/ai/tools/` return errors inconsistently. This is a renamed continuation of HOS-20 which did not complete.

Read each tool and ensure errors are handled predictably:
- `get-health-snapshot.ts`
- `get-sleep-analysis.ts`
- `get-training-status.ts`
- `get-vitals.ts`
- `get-weather.ts`
- `garmin-query.ts`
- `shell-execute.ts`

## What to do

1. Read each tool file listed above
2. For each tool, check: does it have a try/catch? Does it return a useful error message to the agent?
3. Tools that silently fail or throw uncaught errors should be wrapped:
   ```ts
   try {
     // existing logic
   } catch (error) {
     return { error: error instanceof Error ? error.message : String(error) }
   }
   ```
4. Keep changes minimal — only add/improve error handling, don't refactor logic
5. Run `bunx tsc --noEmit` and `bunx biome check .`

## Acceptance Criteria
- All 7 tools have explicit error handling (try/catch or equivalent)
- No tool can throw an uncaught error to the agent loop
- TypeScript and biome pass clean
