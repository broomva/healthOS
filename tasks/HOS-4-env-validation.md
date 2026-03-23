---
title: "Add centralized environment variable validation with Zod"
identifier: "HOS-4"
id: "HOS-4"
state: backlog
priority: 2
project: "healthOS"
---

# HOS-4: Add centralized environment variable validation with Zod

Currently environment variables are accessed directly via process.env without validation. Add a centralized validation schema.

## Implementation
- Create `lib/env.ts` with a Zod schema for all required env vars
- Validate at app startup (in instrumentation.ts or similar)
- Provide clear error messages for missing required vars
- Mark optional vars (OLLAMA_BASE_URL, XAI_API_KEY) as optional in schema

## Acceptance Criteria
- All env vars validated with Zod at startup
- Clear error message if required vars are missing
- Optional vars have sensible defaults
- TypeScript compiles cleanly
