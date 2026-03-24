---

title: "Verify and clean up AI model IDs in lib/ai/models.ts"
identifier: "HOS-16"
id: "HOS-16"
state: todo
priority: 2
project: "healthOS"
updated_at: "2026-03-24T00:00:00.000000+00:00"
---

# HOS-16: Verify and clean up AI model IDs

`lib/ai/models.ts` references several model IDs that need verification. Per the Vercel ecosystem knowledge:
- `gpt-4o` is outdated → use `gpt-5.4` or newer
- `claude-opus-4-6` is valid (claude-sonnet-4-6 is also valid)
- Check for any DALL-E references → replace with `google/gemini-3.1-flash-image-preview`
- Remove or update any models listed as legacy/deprecated

## What to do

1. Read `lib/ai/models.ts` in full
2. Read `lib/ai/providers.ts` to understand provider configuration
3. For each model entry, verify:
   - The model ID is current and not deprecated
   - The provider is correctly configured
   - Remove any models that are clearly outdated (old DALL-E, old GPT-4 variants)
4. Update outdated model IDs to current equivalents:
   - `gpt-4o` → `gpt-5.4` (if present)
   - DALL-E models → remove or replace with gemini image generation
5. Ensure `lib/ai/models.test.ts` still passes after changes:
   ```bash
   bunx vitest run lib/ai/models.test.ts
   ```
   or if using playwright for tests:
   ```bash
   bun run test
   ```
6. Run `bunx tsc --noEmit` and `bunx biome check .`

## Acceptance Criteria
- No clearly deprecated model IDs remain
- TypeScript compiles cleanly
- Biome passes
