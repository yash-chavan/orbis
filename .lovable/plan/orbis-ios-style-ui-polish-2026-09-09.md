# Orbis iOS-style UI polish

## What will change
- Place the title and tagline on a softly frosted, high-contrast glass backing so they remain clear over every part of the globe.
- Show “Find a Destination” only while no destination sheet is open.
- Make both “Spin for a New Vibe” and a new top-right close icon return directly to the clean home view and wide globe camera.
- Keep the globe’s idle rotation running behind an open sheet, with a slightly faster but still calm pace; interaction remains locked while reading.
- Refine type weight, spacing, glass opacity, shadows, badges, navigation controls, and button feedback for a cohesive premium iOS feel.

## Technical details
- Reuse the existing reset handler for both sheet exit controls.
- Keep the globe controls non-interactive while allowing auto-rotation to continue.
- Use existing semantic color tokens and the shared Button component for interactive controls.
- Preserve all current destination fetching, carousel behavior, and fallback content.
- Verify the home and open-sheet states in the running preview at desktop and mobile widths.
