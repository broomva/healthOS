---
# Symphony Workflow — healthOS
# Works through healthOS-specific tasks via markdown tracker

tracker:
  kind: markdown
  project_slug: ./tasks/
  active_states: [todo, in_progress]
  terminal_states: [done, canceled]
  done_state: done

codex:
  command: claude --dangerously-skip-permissions
  max_turns: 25
  timeout: 1800  # 30 minutes per issue

workspace:
  root: /Users/broomva/broomva/apps/healthOS
  strategy: none
  base_branch: main

concurrency: 2
poll_interval: 60  # seconds

hooks:
  after_run: |
    cd /Users/broomva/broomva/apps/healthOS
    git add -A
    git diff --cached --quiet || git commit -m "chore: symphony agent run complete" || true

retry:
  max_retries: 1
  backoff: exponential
  initial_delay: 5
---

# healthOS Agent Prompt

You are an expert software engineer working on **healthOS**, an AI-powered health intelligence platform.

## Issue
**{{ issue.identifier }}**: {{ issue.title }}

{{ issue.description }}

{% if issue.priority %}
**Priority**: {{ issue.priority }}
{% endif %}

## Project Context

healthOS is a Next.js 16 App Router application at `/Users/broomva/broomva/apps/healthOS/` with:
- **AI SDK v6** with multi-provider support (Claude, GPT, Gemini, xAI, Ollama)
- **Garmin Connect** integration for real-time health/fitness data
- **Streaming artifacts** (text, code, sheet, image) with version history
- **PostgreSQL** via Drizzle ORM
- **Auth.js** with credentials + guest login
- **Bun** package manager
- **Deployed on Railway** at https://healthos-production-f46c.up.railway.app

## Key Files
- `app/(chat)/api/chat/route.ts` — Main streaming chat endpoint
- `lib/ai/tools/` — AI tool implementations
- `lib/ai/models.ts` — Model registry
- `lib/ai/prompts.ts` — System prompts
- `lib/ai/entitlements.ts` — User tier entitlements
- `lib/db/schema.ts` — Database schema
- `components/` — React UI components
- `artifacts/` — Artifact kind implementations
- `proxy.ts` — Auth middleware (Next.js 16 proxy)
- `Dockerfile` — Multi-stage Railway build
- `railway.toml` — Railway deployment config

## Development Rules
1. Read CONTROL.md setpoints before making changes
2. Follow existing patterns — read surrounding code first
3. Keep changes minimal and focused on the issue
4. Use `bun` (not npm/yarn) for all package operations
5. Ensure TypeScript compiles cleanly
6. Do NOT modify unrelated files
7. Commit with message format: `{{ issue.identifier }}: <description>`
