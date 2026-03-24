---

title: "Fix TypeScript errors in lib/json-render/registry.tsx after @ts-nocheck removal"
identifier: "HOS-21"
id: "HOS-21"
state: done
priority: 1
project: "healthOS"
updated_at: "2026-03-24T00:00:00.000000+00:00"
---

# HOS-21: Fix TypeScript errors in lib/json-render/registry.tsx

After removing `@ts-nocheck`, two TypeScript errors remain:

```
lib/json-render/registry.tsx(254,7): error TS18046: 'props' is of type 'unknown'.
lib/json-render/registry.tsx(256,9): error TS18046: 'props' is of type 'unknown'.
```

The file has a comment explaining the root cause:
```ts
// @ts-nocheck
// json-render 0.6.1 requires zod v4 for full type inference.
// AI SDK pins zod v3, so we disable type checking here.
// Runtime works correctly — only TypeScript types are affected.
```

## What to do

1. Read `lib/json-render/registry.tsx` around lines 250-260
2. The `props` parameter is typed as `unknown` due to the zod v3/v4 mismatch
3. Fix by adding a type assertion or explicit type annotation at the usage site:
   ```ts
   // Option A: cast props
   const p = props as { someField: string; otherField: number }
   // Option B: use a type guard
   // Option C: add explicit parameter type to the component function
   ```
4. Do NOT re-add `@ts-nocheck` — fix the types properly
5. Run `bunx tsc --noEmit` — must pass with 0 errors
6. Run `bunx biome check .` — must pass clean

## Acceptance Criteria
- `bunx tsc --noEmit` exits 0 with no errors
- `bunx biome check .` passes clean
- No `@ts-nocheck` in the file
