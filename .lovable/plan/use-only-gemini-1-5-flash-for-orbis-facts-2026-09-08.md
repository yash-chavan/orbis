# Use only Gemini 1.5 Flash for Orbis facts

## Goal
Switch the fact-generation call in Orbis to use **only** `gemini-1.5-flash`, removing the current fallback chain of `gemini-3.6-flash` and `gemini-2.5-flash`.

## Current state
`src/lib/facts.functions.ts` calls three models in order:
```ts
const models = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
```

## Change
Update that line to:
```ts
const models = ["gemini-1.5-flash"];
```

No other behavior changes. The existing JSON parsing, field fallback, and mock-fallback paths stay exactly as they are.

## Verification
- Run `bunx tsgo --noEmit` to confirm TypeScript still passes.
- Land on a city spot in the preview and confirm facts load (or fall back to mock copy only on a genuine API failure).
