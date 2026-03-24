---


title: "Fix JSX syntax error in lib/json-render/registry.tsx"
identifier: "HOS-11"
id: "HOS-11"
state: done
priority: 1
project: "healthOS"
updated_at: "2026-03-24T00:32:09.264648+00:00"
---

# HOS-11: Fix JSX syntax error in lib/json-render/registry.tsx

`lib/json-render/registry.tsx` has a JSX syntax error causing 159 biome/TypeScript errors. The issue is on line ~129: a `{/* biome-ignore ... */}` comment is placed as a standalone expression before a `<tr>` element inside a `.map()` callback. In JSX, a standalone comment before a sibling JSX element inside an arrow function is invalid syntax.

## Fix

Move the `biome-ignore` suppression comment so it is either:
1. Placed on the `<tr key={i}>` line as a preceding comment inside the JSX (wrapped in a fragment `<>...</>`), or
2. Changed to a line comment `// biome-ignore ...` on the line directly above the `<tr>` inside the callback

The problematic code (around line 128-143):
```tsx
{props.rows.map((row, i) => (
  {/* biome-ignore lint/suspicious/noArrayIndexKey: table rows without stable IDs */}
  <tr className="border-white/5 border-b" key={i}>
    ...
  </tr>
))}
```

Should become:
```tsx
{props.rows.map((row, i) => (
  // biome-ignore lint/suspicious/noArrayIndexKey: table rows without stable IDs
  <tr className="border-white/5 border-b" key={i}>
    ...
  </tr>
))}
```

## Acceptance Criteria
- `bunx biome check lib/json-render/registry.tsx` reports 0 errors
- `bunx tsc --noEmit` reports 0 errors for this file (the `@ts-nocheck` at top is fine to keep)
- `bun run lint` passes cleanly
