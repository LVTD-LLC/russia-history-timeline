# Changelog

## 2026-09-10 — Russia History Timeline naming

- Renamed the site heading, masthead, browser titles, and README to Russia History Timeline to reflect rulers, events, and art together.
- Updated the site description and package summary while retaining Russian historical content and controls.

## 2026-09-10 — Automatic production deployment

- Added a CI-gated CapRover deployment for every main-branch update, plus manual CI/redeploy support.
- Serialized deployments, skipped superseded commits, and used an app-scoped deployment secret with tracked-source packaging.
- Added public commit-revision verification so accepted uploads or the previous live version cannot falsely report a successful rollout.
- Tested upload rejection, temporary rollout failures, exact revision matching, and bounded deployment waits.

## 2026-09-10 — Unified timeline and linked detail drawer

- Combined rulers, events, and painters in one scrollable timeline with collision-free rows, consistent cards, category colors, and a Russian legend.
- Replaced hover/focus previews with click-open details sliding in from the right: half-width on desktop and full-width on phones.
- Added static, shareable entry URLs with reload and Back/Forward support, modal keyboard focus, Escape dismissal, and focus restoration.
- Preserved chronology, galleries, contemporary links, selectors, and all eight zoom levels; updated desktop and mobile interaction coverage.

## 2026-09-05 — Artwork previews and major events

- Added two attributed artwork previews per painter (72 local, optimized reproductions), with creation dates and source links.
- Added 33 major historical events between ruler and painter timelines, sharing scrolling and all eight zoom levels.
- Linked event cards to rulers and relevant works; distinguished contemporary responses, later depictions and social context.
- Preserved selectable short events, scrollable mobile cards, accessible source links and empty-state explanations.

## 2026-09-05 — Painters alongside rulers

- Added 36 Russian-language painter biographies, lifespan bars, a painter picker and period shortcuts.
- Synchronized horizontal scrolling and all eight zoom levels across rulers and painters; overlapping lives occupy separate rows without shortening their dates.
- Added bidirectional contemporary links to cards, notes about approximate dates, selection gaps, and time spent abroad.
- Verified alignment, touch/hover, keyboard navigation and responsive cards at desktop, 390px and 320px widths.

## 2026-09-05 — Succession and chronology context

- Filled 1132–1155 with 12 Kiev reign segments, including repeated accessions and co-rule.
- Added five hatched context periods to explain every remaining date gap without creating an events lane.
- Added accession and departure explanations for all 79 reign entries, distinguishing inheritance, coups, abdication, death, and changes of office or political center.
- Kept the expanded preview scrollable with close and navigation controls visible on phones.
- Added continuity and succession interaction coverage, plus editorial source notes.

## 2026-09-05

- Replaced the bilingual rulers/events view with a Russian-only, single horizontal ruler timeline.
- Expanded Russian introductions to 67 reigns, with notes on medieval selection, regencies, interruptions, and overlapping Soviet/Russian leadership.
- Added eight proportional zoom levels, era shortcuts, ruler selection, overview navigation, and keyboard controls.
- Redesigned the atlas for phones, with touch scrolling and compact tap-to-open ruler cards; desktop supports hover and focus previews.
- Added desktop and mobile interaction checks and refreshed project documentation.

## 2026-07-05

- Replaced the vertical comparison timeline with horizontal proportional lanes for rulers and major events.
- Added compact thick timeline bands with short descriptions that expand into full details on hover or keyboard focus.
- Added ReviewGate PR review workflow and configuration.
- Added an `@reviewgate review` PR comment trigger for rerunning ReviewGate on demand.

## 2026-07-04

- Reworked the timeline into a shared proportional year scale so ruler spans and major-event markers align vertically.
- Added responsive horizontal scrolling for the scaled timeline to preserve side-by-side comparison on narrow screens.

## 2026-07-03

- Kickstarted the Astro 7 bilingual Russia history timeline site.
- Added side-by-side rulers and major-events timelines in English and Russian.
- Added CapRover deployment files, GitHub Actions build check, and AI steering docs.
