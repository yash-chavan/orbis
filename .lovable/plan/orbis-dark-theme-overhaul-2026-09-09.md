# Orbis dark theme overhaul

## What will change
- Convert the full app to a deep-space iOS dark theme with white primary text, muted silver secondary text, translucent dark-glass surfaces, and subtle light borders.
- Replace the current header backing with a compact centered dark-glass pill while preserving the non-interactive header behavior.
- Add a restrained edge vignette that frames the globe without obscuring terrain or the center reticle.
- Upgrade the bottom destination button with a small compass icon, vibrant purple treatment, and ambient glow.
- Apply the same dark tokens to all three destination cards, badges, temperature controls, navigation arrows, loading skeletons, dividers, and pagination indicators.
- Preserve existing location selection, globe animation, data fetching, swipe navigation, close/reset behavior, and interaction lockdown.

## Technical details
- Rebalance semantic color, glass, border, and shadow tokens in the global stylesheet so all existing UI inherits the dark theme consistently.
- Keep visual values token-driven and use the shared Button component for actions.
- Add only presentation-level class changes to the launch screen and destination drawer.
- Verify the home screen and each card state at desktop and mobile widths, including contrast, clipping, and button visibility.
