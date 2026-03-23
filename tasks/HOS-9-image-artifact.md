---
title: "Wire image artifact generation tool"
identifier: "HOS-9"
id: "HOS-9"
state: backlog
priority: 3
project: "healthOS"
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
