---
title: "Add graceful fallback when Garmin CLI is unavailable"
identifier: "HOS-3"
id: "HOS-3"
state: backlog
priority: 2
project: "healthOS"
---

# HOS-3: Add graceful fallback when Garmin CLI is unavailable

The Garmin query tool (`lib/ai/tools/garmin-query.ts`) executes `~/.local/bin/garmin-connect` CLI which won't exist in the Railway container. Add graceful error handling.

## Acceptance Criteria
- When garmin-connect CLI is not found, return a helpful message instead of crashing
- Tool should check if the binary exists before attempting execution
- Return synthetic/demo data or a clear message that Garmin integration requires local setup
- TypeScript compiles cleanly
