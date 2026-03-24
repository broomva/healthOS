---

title: "Audit chat route for AI SDK v6 compatibility - messages and streaming"
identifier: "HOS-17"
id: "HOS-17"
state: todo
priority: 1
project: "healthOS"
updated_at: "2026-03-24T00:00:00.000000+00:00"
---

# HOS-17: Audit chat route for AI SDK v6 compatibility

The main chat API route at `app/(chat)/api/chat/route.ts` was built during the AI SDK v5→v6 migration. Verify and fix any remaining v5 patterns.

Key v6 patterns that must be in place:
- `convertToModelMessages()` (not `CoreMessage` or direct message passing)
- `toUIMessageStreamResponse()` (not `toDataStreamResponse()`)
- `streamText` with `stopWhen: stepCountIs(N)` (not `maxSteps`)
- Tool definitions use `inputSchema` not `parameters`
- `ModelMessage` type (not `CoreMessage`)

## What to do

1. Read `app/(chat)/api/chat/route.ts` fully
2. Read `app/(chat)/api/chat/schema.ts` for request/response schema
3. Check each of these patterns:
   - Are messages converted with `convertToModelMessages()`?
   - Is the response using `toUIMessageStreamResponse()`?
   - Are tool definitions using `inputSchema`?
   - Is `maxSteps` replaced with `stopWhen: stepCountIs(N)`?
4. Also check `lib/ai/agents/chat-agent.ts` for the same patterns
5. Fix any found issues — keep changes minimal and targeted
6. Run `bunx tsc --noEmit` and `bunx biome check .`

## Acceptance Criteria
- No v5 API patterns remain in the chat route
- `bunx tsc --noEmit` passes
- `bunx biome check .` passes
