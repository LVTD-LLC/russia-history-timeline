# DESIGN.md

## Direction

The site should feel like a modern historical atlas: restrained, readable, and document-like, with enough visual richness to make a long timeline pleasant to scan.

## Visual System

- Background: warm paper and charcoal tones, not pure white or pure black.
- Accent: restrained red used for state/history markers.
- Typography: system serif for historical titles, system sans for UI labels, monospace for dates.
- Cards: keep radii small and use borders more than heavy shadows.

## Layout

- The first viewport must show the project identity and a real historical visual.
- Timelines are side by side on desktop and stacked on mobile.
- Rulers and events should stay visually distinct with different accent borders.
- Every timeline item needs a stable date block, era label, title, and short description.

## Accessibility

- Preserve visible focus states.
- Language toggle buttons must expose `aria-pressed`.
- Keep contrast high enough on all text.
- Do not rely on color alone; labels and headings must name each column.
