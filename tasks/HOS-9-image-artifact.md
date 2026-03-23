---

title: "Wire image artifact generation tool"
identifier: "HOS-9"
id: "HOS-9"
state: done
priority: 3
project: "healthOS"
updated_at: "2026-03-23T21:57:34.024760+00:00"
---

# HOS-9: Wire image artifact generation tool

The image artifact UI exists (`artifacts/image/client.tsx`) but no server-side tool emits `data-imageDelta`. Wire an AI image generation tool.

## Implementation
- Add image generation capability to the chat tools
- Use AI SDK image generation (via AI Gateway or direct provider)
- Emit `data-imageDelta` events for the artifact system
- Follow existing artifact patterns (text, code, sheet)

## Acceptance Criteria
- User can request image generation in chat
- Image appears in artifact panel
- Image is persisted (Vercel Blob or local storage)
