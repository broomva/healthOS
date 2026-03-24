---

title: "Fix @ts-nocheck in components/health-ui-renderer.tsx"
identifier: "HOS-19"
id: "HOS-19"
state: todo
priority: 2
project: "healthOS"
updated_at: "2026-03-24T00:00:00.000000+00:00"
---

# HOS-19: Fix @ts-nocheck in health-ui-renderer.tsx

`components/health-ui-renderer.tsx` has `// @ts-nocheck` at the top, suppressing all TypeScript checks. This is a code smell — the underlying type issues should be fixed properly.

## What to do

1. Read `components/health-ui-renderer.tsx` fully
2. Remove the `// @ts-nocheck` comment
3. Run `bunx tsc --noEmit` to see what errors appear
4. Fix each TypeScript error:
   - Add proper type annotations
   - Import missing types
   - Fix type mismatches with correct casts or type guards
5. Also read `lib/json-render/registry.tsx` (also has `@ts-nocheck`) and apply the same treatment if feasible, or document why it needs to remain
6. Run `bunx tsc --noEmit` and `bunx biome check .` to verify clean

## Acceptance Criteria
- `components/health-ui-renderer.tsx` has no `@ts-nocheck`
- TypeScript compiles cleanly (`bunx tsc --noEmit` passes)
- `bunx biome check .` passes
