---

title: "Standardize error handling across AI tool implementations"
identifier: "HOS-20"
id: "HOS-20"
state: canceled
priority: 3
project: "healthOS"
updated_at: "2026-03-24T00:00:00.000000+00:00"
---

# HOS-20: Standardize error handling across AI tools

The tools in `lib/ai/tools/` return errors inconsistently — some return `{ error: string }`, some throw, some return partial data. This makes the agent unpredictable when tools fail.

## What to do

1. Read each tool in `lib/ai/tools/`:
   - `get-health-snapshot.ts`
   - `get-sleep-analysis.ts`
   - `get-training-status.ts`
   - `get-vitals.ts`
   - `get-weather.ts`
   - `garmin-query.ts`
   - `shell-execute.ts`
2. Identify each tool's error handling pattern
3. Standardize to a consistent pattern:
   ```ts
   // On error, return a structured object the agent can understand:
   return { success: false, error: "Description of what failed", data: null }
   // On success:
   return { success: true, error: null, data: { ... } }
   ```
4. Keep changes minimal — only fix error handling, don't refactor logic
5. Update the `outputSchema` in each tool if it needs to reflect the new shape
6. Run `bunx tsc --noEmit` and `bunx biome check .`

## Acceptance Criteria
- All tools in `lib/ai/tools/` follow a consistent success/error return pattern
- No tool silently swallows errors or returns ambiguous results
- TypeScript compiles cleanly
- Biome passes
