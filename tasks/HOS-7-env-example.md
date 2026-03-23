---

title: "Update .env.example with all required environment variables"
identifier: "HOS-7"
id: "HOS-7"
state: done
priority: 2
project: "healthOS"
updated_at: "2026-03-23T21:50:03.290071+00:00"
---

# HOS-7: Update .env.example with all required environment variables

The .env.example file needs to document all environment variables required for Railway and local development.

## Required Variables
- POSTGRES_URL — Database connection
- AUTH_SECRET — NextAuth JWT signing
- AUTH_TRUST_HOST — true for non-Vercel deployments
- NEXTAUTH_URL — Full URL of the deployment
- ANTHROPIC_API_KEY — Claude API
- OPENAI_API_KEY — GPT API
- GOOGLE_GENERATIVE_AI_API_KEY — Gemini API (optional)
- XAI_API_KEY — xAI API (optional)
- OLLAMA_BASE_URL — Local Ollama (optional, default: http://localhost:11434/v1)
- REDIS_URL — Redis for resumable streams (optional)

## Acceptance Criteria
- .env.example lists all vars with comments explaining each
- Clearly marks required vs optional
- No actual secret values
