# Why facts fall back to canned copy on Vercel

## What's happening

The fact writer reads a secret key at request time:

`src/lib/facts.functions.ts` → `const key = process.env["GEMINI_API_KEY"]`

If that key is missing, the code returns the built-in safety-net copy immediately — no error, no crash, just the canned tunnel/street-food/etiquette lines. That is exactly the symptom you're seeing.

The key was saved inside Lovable, so the Lovable preview has it. A Vercel deployment is a separate hosting environment with its own environment variables, and nothing copies the key across. So on Vercel the key is empty and every location silently uses the fallback pool.

A secondary possibility, only if the key *is* set on Vercel: the deployed runtime differs from Lovable's, and the call to Google could fail (blocked region, wrong runtime, or a model name the key can't access). We can only tell those apart from the server logs.

## Fix

1. In the Vercel project: Settings → Environment Variables → add
   - Name: `GEMINI_API_KEY`
   - Value: the same key you gave me
   - Environments: Production, Preview, Development
2. Redeploy (env vars are only picked up by a new build/deploy).
3. Open a destination on the Vercel URL and confirm the Mind-Blower and Culture cards read as freshly written rather than the canned lines.

## Code change to make diagnosis obvious

Right now a missing key and a failed Google call look identical from the outside. I'll add a small amount of server-side logging in `src/lib/facts.functions.ts`:

- Log a clear one-line warning when `GEMINI_API_KEY` is absent (never the key itself).
- Log when the response parses but a field came back empty and a fallback filled it.

The existing non-OK response logging (model, status, truncated body) stays. No behaviour or copy changes — only logs, so if the Vercel deploy still falls back after you add the key, the Vercel function logs will say precisely why.

## Note on hosting

Lovable's own Publish already runs the app with the key in place, so if you don't need Vercel specifically, publishing from Lovable avoids this class of problem entirely. Happy either way.

## Verification

- `bunx tsgo --noEmit`
- Confirm Lovable preview still generates live facts.
- After you add the key on Vercel and redeploy, check a destination there.
