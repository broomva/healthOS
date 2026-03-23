---
title: "Fix lint tooling mismatch between Makefile and package.json"
identifier: "HOS-5"
id: "HOS-5"
state: todo
priority: 3
project: "healthOS"
---

# HOS-5: Fix lint tooling mismatch between Makefile and package.json

The Makefile runs `biome check` but package.json uses `ultracite`. Standardize on one tool.

## Current State
- `package.json` line 9: `"lint": "bunx ultracite@latest check"`
- `Makefile` line 24: tries `biome check`
- Both `@biomejs/biome` (2.2.2) and `ultracite` (5.3.9) are in devDependencies

## Acceptance Criteria
- Makefile and package.json use the same lint tool
- `make lint` and `bun run lint` produce the same result
- Remove the unused linter from devDependencies
