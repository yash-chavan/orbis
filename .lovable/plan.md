# Fix the 404s from the facts service

## What's wrong

The app asks Google for a model called `gemini-1.5-flash`. Your key no longer has that model, so Google answers 404, the app quietly gives up, and you see the built-in backup copy for "Mind-Blower" and "Culture & Palate".

## Fix

1. Switch the fact request to a single model: `gemini-2.5-flash-lite`. No fallback chain.
2. When Google refuses a request, record the status and message in the server log so a future failure is visible instead of silent.
3. Keep the backup copy exactly as-is; it should only appear on a genuine outage.

## Nothing needed from you

Your key is already saved and working — no new key, no dashboard change.

## Technical notes

- `src/lib/facts.functions.ts`: change `const models = ["gemini-1.5-flash"]` to `["gemini-2.5-flash-lite"]`.
- In `callGemini`, on a non-OK response read the body and `console.error` the model, status, and message before falling back.

## Verification

- Call the model endpoint directly with the stored key and confirm a 200.
- Land on a city in the preview and confirm all three cards show fresh AI copy, not the backup lines.
