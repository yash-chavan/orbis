# Orbis

Build a production-grade React application called "Orbis" using a clean LIGHT THEME.

1. COLOR PALETTE & STYLING RULES:
- Primary Background: #F8FAFC (Soft slate-white, clean & airy)
- Card / Modal Surface: #FFFFFF with 80% opacity backdrop-blur-md (Glassmorphism)
- Oceans & Water: #E0F2FE (Soft sky blue, light & crisp)
- Landmasses: #CBD5E1 (Slate gray) with pastel green highlights (#86EFAC)
- Primary Accent / CTA: #6366F1 (Electric Indigo)
- Secondary Accent: #10B981 (Emerald Green - for temperature badges & live status)
- Dark Text: #0F172A (Deep navy slate - never pure black)
- Subtle Borders: #E2E8F0 (Soft light gray dividers)

2. VISUAL THEME & LAYOUT:
- Top Header: Minimal floating glassmorphism pill showing "Orbis 🌍" on the left and an instruction badge "👆 Drag & flick the globe to discover" on the right.
- Theme accent: Modern electric violet (#6366F1) for active triggers, badges, and card styling.

3. INTERACTIVE 3D GLOBE ENGINE:
- Full-screen interactive 3D Globe using `react-globe.gl` or `@three-js`.
- USER INTERACTION: Users directly drag/flick the globe with physics momentum.
- Center-screen subtle reticle/crosshair target overlay (`fixed inset-0 pointer-events-none`).
- DECELERATION LOGIC: When globe dragging stops completely (velocity hits 0), record the exact lat/long coordinate under the center crosshair.
- ANIMATION: Trigger a subtle 1.2x camera micro-zoom toward the point and spawn a pulsing glowing beacon marker at those coordinates.

4. DATA FETCHING (FREE APIS):
- Fetch live weather using keyless Open-Meteo:
  `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current_weather=true`
- Reverse geocode location via `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lng}&localityLanguage=en` or REST Countries API to get City, Country, and Country Code (for Flag SVG).

5. GEMINI LLM AGENT FACT ENGINE:
- Call Google Gemini API (`gemini-1.5-flash` or `gemini-2.5-flash`) using `process.env.GEMINI_API_KEY`.
- Pass payload: `{ city, country, temperature, weatherCondition, localTime, isWilderness, isOcean }`.
- System Prompt: "You are an unhinged, hilarious travel & exploration guide. Output strictly valid JSON with no markdown block wrappers matching this schema:"
  {
    "vibeSummary": "2 short punchy sentences summarizing what standing here right now feels like based on the live weather.",
    "bizarreFact": "1 jaw-dropping, lesser-known historical fact, geological anomaly, or strange trivia about this area.",
    "localFood": "Must-try iconic local street food OR (if in wild/ocean) a famous local survival snack / native plant.",
    "localSlang": "1 real local slang word/phrase OR (if in wild/ocean) a fun wilderness/survival rule."
  }
- Fallback/Error state: If API key is missing or call fails, serve pre-baked humorous mock JSON facts so the app never breaks.
- DYNAMIC MODES BASED ON GEOLOCATION:
  - CITY MODE: Standard urban vibe, street food, and city slang.
  - WILDERNESS MODE (if city is null/remote): Change card styling to Earthy Emerald, display Lat/Long + Biome Title, and provide wildlife/geography facts.
  - OCEAN MODE (if in water): Change card styling to Deep Azure, display "Deep Sea Expedition Mode", ocean trench facts, marine biology secrets, or shipwreck tales.

6. SWIPEABLE 3-CARD CAROUSEL UI:
- Slide up a bottom glassmorphism modal (`framer-motion` sliding drawer).
- Horizontal swipeable carousel with progress dots (Card 1 of 3, 2 of 3, 3 of 3):
  - CARD 1 ("The Vibe Check"): Location/Biome Name, Flag/Icon, Live Temp (°C/°F toggle switch), Weather Icon, Local Time, and `vibeSummary`.
  - CARD 2 ("Mind-Blower"): "Did You Know?" header + `bizarreFact` text + glowing icon.
  - CARD 3 ("Culture & Palate / Wild Explorer"): `localFood` recommendation badge + `localSlang` badge.

7. END-OF-STACK ACTION CONTROLS:
- On reaching or completing Card 3, display two action buttons at the base:
  - Primary Accent Button (#6366F1): "🌀 Spin for a New Vibe" (Closes modal, zooms out camera to global view, ready for next flick).
  - Secondary Outline Button: "📜 Relive This Spot" (Snaps carousel back to Card 1).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f45a9511-e7a0-4c98-9300-7c573d09f34d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
