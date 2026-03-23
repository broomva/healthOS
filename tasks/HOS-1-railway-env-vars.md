---

title: "Configure Railway environment variables for AI providers"
identifier: "HOS-1"
id: "HOS-1"
state: done
priority: 1
project: "healthOS"
updated_at: "2026-03-23T21:49:22.301127+00:00"
---

# HOS-1: Configure Railway environment variables for AI providers

Set up the required environment variables in Railway for the healthOS deployment to enable AI features.

## Required Variables
- `ANTHROPIC_API_KEY` — Claude API access
- `OPENAI_API_KEY` — GPT model access  
- `XAI_API_KEY` — xAI/Grok access (optional)
- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini access (optional)

## Acceptance Criteria
- AI chat features work end-to-end on the Railway deployment
- Send a message and receive a streamed AI response
- Verify via `railway service logs`
