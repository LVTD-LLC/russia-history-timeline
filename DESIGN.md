# Design

A Russian-language historical atlas: warm paper, charcoal type, muted era colors, serif names and restrained editorial imagery.

- One horizontal ruler lane, an event lane, and an aligned painter-lifespan lane at every viewport width. No language switch.
- Position and reign width use the same pixels-per-year scale; short reign labels collapse instead of distorting time. The ruler picker and keyboard navigation keep every entry accessible.
- Eight zoom levels preserve the year at the viewport center. Era shortcuts and an overview slider navigate the full range.
- Desktop: compact hover/focus preview, click to keep open. Phone: tap opens a bottom card, with close and previous/next controls.
- Keep document width within the viewport; only timeline and era shortcuts scroll horizontally.
- Painters use muted green bars, full lifespan widths, and non-overlapping rows. Pack the visible selection to avoid empty rows in early periods; dense periods scroll vertically. Empty ranges explicitly explain the limits of the selection.
- All three scrollports share year coordinates, zoom and horizontal scrolling. Cards link to contemporaries in the other lane; approximate years and life abroad are explicit.
- Native controls, visible keyboard focus, Escape dismissal, reduced-motion support, Russian accessible labels, no external fonts.

- Events sit between rulers and painters in warm ochre. Dots mark point events; thin duration bars retain the real year scale. Labels have a minimum readable width and are packed into non-overlapping rows, explicitly independent of duration.
- Painter previews show two contained (uncropped) thumbnails with title, creation date, credit and source. Event galleries show interpretive notes and author links. Cards retain fixed close/navigation controls around a scrollable body; image failures preserve an external source link.
