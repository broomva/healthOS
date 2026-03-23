---
title: "Remove dead migration helper code"
identifier: "HOS-8"
id: "HOS-8"
state: todo
priority: 4
project: "healthOS"
---

# HOS-8: Remove dead migration helper code

The file `lib/db/helpers/01-core-to-parts.ts` contains commented-out migration helper code that is no longer needed.

## Acceptance Criteria
- Remove the file if entirely unused
- Or clean up commented-out code if file is still referenced
- No broken imports after cleanup
- TypeScript compiles cleanly
