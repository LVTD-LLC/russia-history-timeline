import { events } from "../data/events";
import { artworks, type Artwork } from "../data/artworks";
import { painters, overlaps, painterRows } from "../data/painters";
import {
  timeline as items,
  eras,
  START_YEAR,
  END_YEAR,
} from "../data/timeline";

const element = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const viewport = element<HTMLDivElement>("timeline");
const track = element<HTMLDivElement>("timeline-track");
const zoom = element<HTMLInputElement>("zoom");
const position = element<HTMLInputElement>("position");
const picker = element<HTMLSelectElement>("ruler-picker");
const preview = element<HTMLElement>("ruler-preview");
const buttons = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-ruler]"),
];
const eraButtons = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-era]"),
];
const ticks = [...document.querySelectorAll<HTMLElement>(".year-tick")];
const scales = [2, 4, 8, 16, 32, 64, 128, 256];
let scale = scales[Number(zoom.value)];
const painterViewport = element<HTMLDivElement>("painters-timeline");
const painterTrack = element<HTMLDivElement>("painters-track");
const painterPicker = element<HTMLSelectElement>("painter-picker");
const painterButtons = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-painter]"),
];
const eventViewport = element<HTMLDivElement>("events-timeline");
const eventTrack = element<HTMLDivElement>("events-track");
const eventPicker = element<HTMLSelectElement>("event-picker");
const eventButtons = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-event]"),
];
let mirroredEventScroll = -1;
let activeEvent = -1;
let mirroredPainterScroll = -1;
let activePainter = -1;
let active = -1;
const activeButton = () =>
  activeEvent >= 0
    ? eventButtons[activeEvent]
    : activePainter >= 0
      ? painterButtons[activePainter]
      : buttons[active];
let pinned = false;
let closeTimer: ReturnType<typeof setTimeout>;
let suppressFocus = false;
let hoverDismissed = false;
const motion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
const padding = () => parseFloat(getComputedStyle(track).marginLeft);
const yearAt = (x: number) =>
  START_YEAR + (viewport.scrollLeft + x - padding()) / scale;
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

function placePreview() {
  if (
    (active < 0 && activePainter < 0 && activeEvent < 0) ||
    preview.hidden ||
    matchMedia("(max-width: 640px)").matches
  )
    return;
  const rect = activeButton().getBoundingClientRect();
  const box = (
    activeEvent >= 0
      ? eventViewport
      : activePainter >= 0
        ? painterViewport
        : viewport
  ).getBoundingClientRect();
  const anchor = clamp(
    rect.left + Math.min(rect.width / 2, 150),
    box.left + 30,
    box.right - 30,
  );
  const below = rect.bottom + 12;
  const fitsBelow = below + preview.offsetHeight <= innerHeight - 12;
  const fitsAbove = rect.top - preview.offsetHeight - 12 >= 12;
  // Tall art cards use the side of the anchor so opening a hover card does not cover its trigger.
  const useSide = !fitsBelow && !fitsAbove;
  const left = useSide
    ? anchor + 20 + preview.offsetWidth <= innerWidth - 12
      ? anchor + 20
      : anchor - preview.offsetWidth - 20
    : anchor - preview.offsetWidth / 2;
  preview.style.left = `${clamp(left, 12, innerWidth - preview.offsetWidth - 12)}px`;
  const top = useSide
    ? rect.top - preview.offsetHeight / 2
    : fitsBelow
      ? below
      : rect.top - preview.offsetHeight - 12;
  preview.style.top = `${clamp(top, 12, innerHeight - preview.offsetHeight - 12)}px`;
}
function closePreview(restoreFocus = false) {
  if (restoreFocus) hoverDismissed = true;
  clearTimeout(closeTimer);
  const previous = activeButton();
  preview.hidden = true;
  previous?.setAttribute("aria-expanded", "false");
  active = -1;
  activeEvent = -1;
  activePainter = -1;
  pinned = false;
  if (restoreFocus && previous) {
    suppressFocus = true;
    previous.focus({ preventScroll: true });
    suppressFocus = false;
  }
}
function openPreview(index: number, pin = false) {
  clearTimeout(closeTimer);
  activeButton()?.setAttribute("aria-expanded", "false");
  activeEvent = -1;
  activePainter = -1;
  active = index;
  pinned = pin;
  const ruler = items[index];
  const era = eras.find((e) => e.id === ruler.era)!;
  element("preview-era").textContent = era.name;
  element("preview-dates").textContent = ruler.dates;
  element("preview-name").textContent = ruler.name;
  element("preview-title").textContent = ruler.title;
  element("preview-intro").textContent = ruler.intro;
  element("accession-label").textContent =
    ruler.kind === "context" ? "Начало периода" : "Приход к власти";
  element("departure-label").textContent =
    ruler.kind === "context" ? "Чем завершился" : "Завершение правления";
  element("preview-accession").textContent = ruler.accession;
  element("preview-departure").textContent = ruler.departure;
  document.querySelector(".preview-body")!.scrollTop = 0;
  element("preview-count").textContent =
    `Позиция ${index + 1} из ${items.length}`;
  element<HTMLButtonElement>("previous-ruler").disabled = index === 0;
  element<HTMLButtonElement>("next-ruler").disabled =
    index === items.length - 1;
  preview.style.setProperty("--preview-color", era.color);
  buttons[index].setAttribute("aria-expanded", "true");
  preview.hidden = false;
  picker.value = ruler.id;
  element("previous-ruler").setAttribute("aria-label", "Предыдущий правитель");
  element("next-ruler").setAttribute("aria-label", "Следующий правитель");
  showGallery([]);
  showRelatedEvents("ruler", index);
  showContemporaries(false, index);
  placePreview();
}
function scheduleClose() {
  if (!pinned) closeTimer = setTimeout(() => closePreview(), 220);
}
function updateView() {
  if (Math.abs(eventViewport.scrollLeft - viewport.scrollLeft) > 1) {
    eventViewport.scrollLeft = viewport.scrollLeft;
    mirroredEventScroll = eventViewport.scrollLeft;
  }
  if (Math.abs(painterViewport.scrollLeft - viewport.scrollLeft) > 1) {
    painterViewport.scrollLeft = viewport.scrollLeft;
    mirroredPainterScroll = painterViewport.scrollLeft;
  }
  const first = clamp(Math.floor(yearAt(0)), START_YEAR, END_YEAR - 1);
  const last = clamp(
    Math.ceil(yearAt(viewport.clientWidth)),
    START_YEAR,
    END_YEAR - 1,
  );
  element("visible-years").textContent = `${first} — ${last}`;
  const maxScroll = viewport.scrollWidth - viewport.clientWidth;
  position.value = String(
    maxScroll > 0 ? (viewport.scrollLeft / maxScroll) * 1000 : 0,
  );
  position.setAttribute("aria-valuetext", `Видимые годы: ${first}–${last}`);
  const windowStart = clamp(
    (yearAt(0) - START_YEAR) / (END_YEAR - START_YEAR),
    0,
    1,
  );
  const windowEnd = clamp(
    (yearAt(viewport.clientWidth) - START_YEAR) / (END_YEAR - START_YEAR),
    0,
    1,
  );
  const window = element("overview-window");
  window.style.left = `${windowStart * 100}%`;
  window.style.width = `${(windowEnd - windowStart) * 100}%`;
  const currentEra =
    [...eras]
      .reverse()
      .find((e) => e.start <= yearAt(viewport.clientWidth / 2)) ?? eras[0];
  eraButtons.forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.era === currentEra.id)),
  );
  element<HTMLButtonElement>("pan-back").disabled = viewport.scrollLeft <= 1;
  element<HTMLButtonElement>("pan-forward").disabled =
    viewport.scrollLeft >= maxScroll - 1;
  layoutPainters();
  layoutEvents();
  placePreview();
}
function updateScale(
  anchorYear = yearAt(viewport.clientWidth / 2),
  anchorX = viewport.clientWidth / 2,
) {
  scale = scales[Number(zoom.value)];
  track.style.setProperty("--scale", `${scale}px`);
  painterTrack.style.setProperty("--scale", `${scale}px`);
  eventTrack.style.setProperty("--scale", `${scale}px`);
  buttons.forEach((button) => {
    const width = Number(button.dataset.span) * scale;
    button.classList.toggle("compact", width < 125);
    button.classList.toggle("tiny", width < 40);
  });
  const interval = scale < 4 ? 50 : scale < 16 ? 25 : scale < 32 ? 10 : 5;
  ticks.forEach((tick) => {
    tick.hidden = Number(tick.dataset.year) % interval !== 0;
  });
  const label = `×${scale / scales[0]}`;
  element("scale-label").textContent = label;
  zoom.setAttribute("aria-valuetext", `Увеличение ${label}`);
  element<HTMLButtonElement>("zoom-out").disabled = zoom.value === zoom.min;
  element<HTMLButtonElement>("zoom-in").disabled = zoom.value === zoom.max;
  viewport.scrollLeft = (anchorYear - START_YEAR) * scale + padding() - anchorX;
  updateView();
}
function goToRuler(index: number) {
  const ruler = items[index];
  if (!ruler) return;
  // Keep short reigns selectable without magnifying the whole history automatically.
  viewport.scrollTo({
    left:
      (ruler.start - START_YEAR) * scale +
      padding() -
      viewport.clientWidth * 0.25,
    behavior: "instant",
  });
  openPreview(index, true);
  updateView();
}
buttons.forEach((button, index) => {
  button.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse" && !pinned && !hoverDismissed)
      openPreview(index);
  });
  button.addEventListener("pointerleave", scheduleClose);
  button.addEventListener("focus", () => {
    if (!suppressFocus) openPreview(index);
  });
  button.addEventListener("click", () => {
    if (active === index && pinned) closePreview();
    else openPreview(index, true);
  });
  button.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      event.stopPropagation();
      const next = clamp(
        index + (event.key === "ArrowRight" ? 1 : -1),
        0,
        items.length - 1,
      );
      buttons[next].focus({ preventScroll: true });
      goToRuler(next);
    }
  });
});
preview.addEventListener("pointerenter", () => clearTimeout(closeTimer));
preview.addEventListener("pointerleave", scheduleClose);
preview.addEventListener("focusin", () => {
  pinned = true;
  clearTimeout(closeTimer);
});
element("close-preview").addEventListener("click", () => closePreview(true));
element("previous-ruler").addEventListener("click", () =>
  activeEvent >= 0
    ? goToEvent(activeEvent - 1)
    : activePainter >= 0
      ? goToPainter(activePainter - 1)
      : goToRuler(active - 1),
);
element("next-ruler").addEventListener("click", () =>
  activeEvent >= 0
    ? goToEvent(activeEvent + 1)
    : activePainter >= 0
      ? goToPainter(activePainter + 1)
      : goToRuler(active + 1),
);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !preview.hidden) closePreview(true);
});
document.addEventListener("pointerdown", (event) => {
  const target = event.target as HTMLElement;
  if (
    !preview.contains(target) &&
    !target.closest("[data-ruler], [data-painter], [data-event]") &&
    !target.closest(".zoom-control")
  )
    closePreview();
});
document.addEventListener("focusin", (event) => {
  const target = event.target as HTMLElement;
  if (
    !preview.contains(target) &&
    !target.closest("[data-ruler], [data-painter], [data-event]") &&
    !target.closest(".zoom-control")
  )
    closePreview();
});
zoom.addEventListener("input", () => updateScale());
for (const [id, delta] of [
  ["zoom-out", -1],
  ["zoom-in", 1],
] as const) {
  element(id).addEventListener("click", () => {
    zoom.value = String(
      clamp(Number(zoom.value) + delta, 0, scales.length - 1),
    );
    updateScale();
  });
}
position.addEventListener("input", () => {
  closePreview();
  viewport.scrollLeft =
    (Number(position.value) / 1000) *
    (viewport.scrollWidth - viewport.clientWidth);
  updateView();
});
picker.addEventListener("change", () => {
  const index = items.findIndex((r) => r.id === picker.value);
  if (index >= 0) goToRuler(index);
});
eraButtons.forEach((button) =>
  button.addEventListener("click", () => {
    closePreview();
    viewport.scrollTo({
      left: (Number(button.dataset.year) - START_YEAR) * scale,
      behavior: motion(),
    });
  }),
);
for (const [id, direction] of [
  ["pan-back", -1],
  ["pan-forward", 1],
] as const) {
  element(id).addEventListener("click", () => {
    closePreview();
    viewport.scrollBy({
      left: viewport.clientWidth * 0.75 * direction,
      behavior: motion(),
    });
  });
}
for (const scrollport of [viewport, painterViewport, eventViewport])
  scrollport.addEventListener("keydown", (event) => {
    if (event.target !== scrollport) return;
    if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      closePreview();
      if (event.key === "Home" || event.key === "End")
        viewport.scrollTo({
          left: event.key === "Home" ? 0 : viewport.scrollWidth,
          behavior: motion(),
        });
      else
        viewport.scrollBy({
          left:
            viewport.clientWidth * 0.5 * (event.key === "ArrowRight" ? 1 : -1),
          behavior: motion(),
        });
    }
  });
viewport.addEventListener("scroll", updateView, { passive: true });
window.addEventListener("scroll", placePreview, { passive: true });
painterViewport.addEventListener(
  "scroll",
  () => {
    if (
      Math.abs(painterViewport.scrollLeft - mirroredPainterScroll) > 1 &&
      Math.abs(viewport.scrollLeft - painterViewport.scrollLeft) > 1
    ) {
      viewport.scrollLeft = painterViewport.scrollLeft;
      updateView();
    }
    placePreview();
  },
  { passive: true },
);
new ResizeObserver(updateView).observe(viewport);
new ResizeObserver(placePreview).observe(preview);
function layoutPainters() {
  const first = yearAt(0),
    last = yearAt(viewport.clientWidth);
  const selection = painters.filter((p) => p.start < last && p.end > first);
  const rows = painterRows(selection);
  const byId = new Map(rows.map((r) => [r.painter.id, r.row]));
  painterButtons.forEach((button, index) => {
    const row = byId.get(painters[index].id);
    button.hidden = row === undefined;
    if (row !== undefined) {
      button.style.top = `${42 + row * 54}px`;
      // Keep labels readable when the beginning of a long life is off-screen.
      const offset = Math.max(0, (first - painters[index].start) * scale + 6);
      const label = button.firstElementChild as HTMLElement;
      label.style.left = `${offset}px`;
      label.style.maxWidth = `${Math.max(0, (painters[index].end - painters[index].start) * scale - offset - 6)}px`;
    }
  });
  const height = Math.max(
    90,
    52 + (Math.max(-1, ...rows.map((r) => r.row)) + 1) * 54,
  );
  painterTrack.style.height = `${height}px`;
  painterViewport.style.height = `${Math.min(height + 16, 300)}px`;
  element("painters-empty").hidden = selection.length > 0;
  element("painter-count").textContent =
    `В поле зрения: ${selection.length} из ${painters.length}`;
}
function showContemporaries(isPainter: boolean, index: number) {
  const source = isPainter ? painters[index] : items[index];
  const matches = isPainter
    ? items.filter((r) => r.kind === "ruler" && overlaps(source, r))
    : painters.filter((p) => overlaps(source, p));
  const details = element<HTMLDetailsElement>("contemporaries");
  details.open = false;
  details.hidden = !isPainter && items[index].kind === "context";
  element("contemporaries-label").textContent =
    `${isPainter ? "Правители" : "Художники"}-современники (${matches.length})`;
  const links = element("contemporary-links");
  links.replaceChildren();
  if (!matches.length) {
    links.textContent = "В подборке нет художников, живших в это правление.";
  }
  matches.forEach((match) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${match.name} · ${match.dates}`;
    button.addEventListener("click", () => {
      if (isPainter) goToRuler(items.findIndex((r) => r.id === match.id));
      else goToPainter(painters.findIndex((p) => p.id === match.id));
      element("close-preview").focus({ preventScroll: true });
    });
    links.append(button);
  });
}
function openPainter(index: number, pin = false) {
  clearTimeout(closeTimer);
  activeButton()?.setAttribute("aria-expanded", "false");
  active = -1;
  activeEvent = -1;
  activePainter = index;
  pinned = pin;
  const painter = painters[index];
  for (const [id, text] of Object.entries({
    "preview-era": "ЖИВОПИСЬ · ГОДЫ ЖИЗНИ",
    "preview-dates": painter.dates,
    "preview-name": painter.name,
    "preview-title": painter.title,
    "preview-intro": painter.intro,
    "accession-label": "Связь с Россией",
    "departure-label": "Известные работы",
    "preview-accession": painter.connection,
    "preview-departure": painter.works,
    "preview-count": `Художник ${index + 1} из ${painters.length}`,
  }))
    element(id).textContent = text;
  document.querySelector(".preview-body")!.scrollTop = 0;
  element<HTMLButtonElement>("previous-ruler").disabled = index === 0;
  element<HTMLButtonElement>("next-ruler").disabled =
    index === painters.length - 1;
  element("previous-ruler").setAttribute("aria-label", "Предыдущий художник");
  element("next-ruler").setAttribute("aria-label", "Следующий художник");
  preview.style.setProperty("--preview-color", "#416b52");
  painterButtons[index].setAttribute("aria-expanded", "true");
  painterPicker.value = painter.id;
  showGallery(artworks.filter((a) => a.painter === painter.id));
  showRelatedEvents("painter", index);
  showContemporaries(true, index);
  preview.hidden = false;
  placePreview();
}
function goToPainter(index: number) {
  const painter = painters[index];
  if (!painter) return;
  viewport.scrollLeft =
    (painter.start - START_YEAR) * scale +
    padding() -
    viewport.clientWidth * 0.25;
  updateView();
  const button = painterButtons[index];
  painterViewport.scrollTop = Math.max(0, parseFloat(button.style.top) - 42);
  openPainter(index, true);
}
painterPicker.addEventListener("change", () => {
  const index = painters.findIndex((p) => p.id === painterPicker.value);
  if (index >= 0) goToPainter(index);
});
document
  .querySelectorAll<HTMLButtonElement>("[data-painter-year]")
  .forEach((button) =>
    button.addEventListener("click", () => {
      closePreview();
      viewport.scrollLeft =
        (Number(button.dataset.painterYear) - START_YEAR) * scale;
      painterViewport.scrollTop = 0;
      updateView();
    }),
  );
painterButtons.forEach((button, index) => {
  button.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse" && !pinned && !hoverDismissed)
      openPainter(index);
  });
  button.addEventListener("pointerleave", scheduleClose);
  button.addEventListener("focus", () => {
    if (!suppressFocus) openPainter(index);
  });
  button.addEventListener("click", () => {
    if (activePainter === index && pinned) closePreview();
    else openPainter(index, true);
  });
  button.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const next = clamp(
      index + (event.key === "ArrowRight" ? 1 : -1),
      0,
      painters.length - 1,
    );
    goToPainter(next);
    suppressFocus = true;
    painterButtons[next].focus({ preventScroll: true });
    suppressFocus = false;
  });
});
function layoutEvents() {
  const first = yearAt(0),
    last = yearAt(viewport.clientWidth),
    ends: number[] = [];
  let visible = 0;
  eventButtons.forEach((button, index) => {
    const event = events[index];
    button.hidden = event.start >= last || event.end <= first;
    if (button.hidden) return;
    visible++;
    const labelStart = Math.max(event.start, first);
    const visualEnd = Math.max(event.end, labelStart + 176 / scale);
    let row = ends.findIndex((end) => end + 8 / scale <= event.start);
    if (row < 0) row = ends.length;
    ends[row] = visualEnd;
    button.style.top = `${42 + row * 62}px`;
    button.style.width = `${(visualEnd - event.start) * scale}px`;
    const duration = button.querySelector<HTMLElement>(".event-duration")!;
    duration.style.width = `${Math.max(2, (event.end - event.start) * scale)}px`;
    button.classList.toggle("point-event", event.end - event.start < 1);
    button.querySelector<HTMLElement>(".event-label")!.style.marginLeft =
      `${Math.max(0, (first - event.start) * scale)}px`;
  });
  const height = Math.max(100, 52 + ends.length * 62);
  eventTrack.style.height = `${height}px`;
  eventViewport.style.height = `${Math.min(height + 16, 250)}px`;
  element("events-empty").hidden = visible > 0;
  element("event-count").textContent =
    `В поле зрения: ${visible} из ${events.length}`;
}
function showGallery(selection: Artwork[], notes: Record<string, string> = {}) {
  const gallery = element("artwork-gallery");
  if (activeEvent >= 0) element("contemporaries").before(gallery);
  else element("preview-intro").before(gallery);
  gallery.replaceChildren();
  gallery.hidden = selection.length === 0;
  selection.forEach((work) => {
    const figure = document.createElement("figure");
    const link = document.createElement("a");
    link.href = work.source;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.setAttribute(
      "aria-label",
      `Открыть оригинал и источник: ${work.title}`,
    );
    const img = document.createElement("img");
    img.src = work.image;
    img.alt = `${painters.find((p) => p.id === work.painter)?.name}. ${work.title}, ${work.date}`;
    img.width = 300;
    img.height = 180;
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => {
      img.hidden = true;
      link.textContent = "Открыть произведение в источнике ↗";
    });
    link.append(img);
    figure.append(link);
    const caption = document.createElement("figcaption");
    const title = document.createElement("strong");
    title.textContent = work.title;
    caption.append(title);
    const date = document.createElement("span");
    date.textContent = work.date;
    caption.append(date);
    if (activePainter < 0) {
      const author = document.createElement("button");
      author.type = "button";
      author.textContent =
        painters.find((p) => p.id === work.painter)!.name + " →";
      author.addEventListener("click", () => {
        goToPainter(painters.findIndex((p) => p.id === work.painter));
        element("close-preview").focus({ preventScroll: true });
      });
      caption.append(author);
    }
    const credit = document.createElement("a");
    credit.href = work.source;
    credit.target = "_blank";
    credit.rel = "noreferrer";
    credit.className = "art-credit";
    credit.textContent = `${work.credit} · ${work.license} ↗`;
    caption.append(credit);
    if (notes[work.id]) {
      const note = document.createElement("p");
      note.textContent = notes[work.id];
      caption.append(note);
      figure.classList.add("art-with-note");
    }
    figure.append(caption);
    gallery.append(figure);
  });
}
function showRelatedEvents(kind: "ruler" | "painter", index: number) {
  const source = kind === "ruler" ? items[index] : painters[index];
  const related = events.filter(
    (e) =>
      overlaps(e, source) ||
      (kind === "painter" &&
        e.art.some((ref) =>
          artworks.some((a) => a.id === ref.id && a.painter === source.id),
        )),
  );
  const details = element<HTMLDetailsElement>("related-events");
  details.open = false;
  details.hidden = kind === "ruler" && items[index].kind === "context";
  element("related-events-label").textContent =
    `${kind === "ruler" ? "События правления" : "События и искусство"} (${related.length})`;
  const links = element("event-links");
  links.replaceChildren();
  if (!related.length) links.textContent = "В подборке нет связанных событий.";
  related.forEach((e) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${e.name} · ${e.dates}`;
    if (
      kind === "painter" &&
      e.art.some((ref) =>
        artworks.some((a) => a.id === ref.id && a.painter === source.id),
      )
    )
      button.textContent += " · В произведениях";
    button.addEventListener("click", () => {
      goToEvent(events.indexOf(e));
      element("close-preview").focus({ preventScroll: true });
    });
    links.append(button);
  });
}
function openEvent(index: number, pin = false) {
  clearTimeout(closeTimer);
  activeButton()?.setAttribute("aria-expanded", "false");
  active = -1;
  activePainter = -1;
  activeEvent = index;
  pinned = pin;
  const event = events[index];
  for (const [id, text] of Object.entries({
    "preview-era": "ИСТОРИЧЕСКОЕ СОБЫТИЕ",
    "preview-dates": event.dates,
    "preview-name": event.name,
    "preview-title": event.category,
    "preview-intro": event.intro,
    "accession-label": "Итоги и значение",
    "preview-accession": event.outcome,
    "departure-label": "Искусство и история",
    "preview-departure": event.art.length
      ? "В подборке есть произведения, связанные с событием или его историческим контекстом. Обратите внимание на дату создания и пояснение под изображением."
      : "Для этого события пока нет проверенной связи с произведениями из нашей подборки. Совпадение лет жизни художника и события само по себе не доказывает такой связи.",
    "preview-count": `Событие ${index + 1} из ${events.length}`,
  }))
    element(id).textContent = text;
  element<HTMLButtonElement>("previous-ruler").disabled = index === 0;
  element<HTMLButtonElement>("next-ruler").disabled =
    index === events.length - 1;
  element("previous-ruler").setAttribute("aria-label", "Предыдущее событие");
  element("next-ruler").setAttribute("aria-label", "Следующее событие");
  preview.style.setProperty("--preview-color", "#986c2e");
  eventButtons[index].setAttribute("aria-expanded", "true");
  eventPicker.value = event.id;
  element("related-events").hidden = true;
  const details = element<HTMLDetailsElement>("contemporaries");
  details.hidden = false;
  details.open = false;
  const rulers = items.filter((r) => r.kind === "ruler" && overlaps(event, r));
  element("contemporaries-label").textContent =
    `Правители во время события (${rulers.length})`;
  const links = element("contemporary-links");
  links.replaceChildren();
  rulers.forEach((r) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = `${r.name} · ${r.dates}`;
    b.addEventListener("click", () => {
      goToRuler(items.indexOf(r));
      element("close-preview").focus({ preventScroll: true });
    });
    links.append(b);
  });
  showGallery(
    event.art
      .map((ref) => artworks.find((a) => a.id === ref.id)!)
      .filter(Boolean),
    Object.fromEntries(event.art.map((ref) => [ref.id, ref.note])),
  );
  document.querySelector(".preview-body")!.scrollTop = 0;
  preview.hidden = false;
  placePreview();
}
function goToEvent(index: number) {
  const event = events[index];
  if (!event) return;
  viewport.scrollLeft =
    (event.start - START_YEAR) * scale +
    padding() -
    viewport.clientWidth * 0.25;
  updateView();
  eventViewport.scrollTop = Math.max(
    0,
    parseFloat(eventButtons[index].style.top) - 42,
  );
  openEvent(index, true);
}
eventPicker.addEventListener("change", () => {
  const index = events.findIndex((e) => e.id === eventPicker.value);
  if (index >= 0) goToEvent(index);
});
eventViewport.addEventListener(
  "scroll",
  () => {
    if (
      Math.abs(eventViewport.scrollLeft - mirroredEventScroll) > 1 &&
      Math.abs(viewport.scrollLeft - eventViewport.scrollLeft) > 1
    ) {
      viewport.scrollLeft = eventViewport.scrollLeft;
      updateView();
    }
    placePreview();
  },
  { passive: true },
);
document
  .querySelectorAll<HTMLButtonElement>("[data-event-year]")
  .forEach((button) =>
    button.addEventListener("click", () => {
      closePreview();
      viewport.scrollLeft =
        (Number(button.dataset.eventYear) - START_YEAR) * scale;
      eventViewport.scrollTop = 0;
      updateView();
    }),
  );
eventButtons.forEach((button, index) => {
  button.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "mouse" && !pinned && !hoverDismissed)
      openEvent(index);
  });
  button.addEventListener("pointerleave", scheduleClose);
  button.addEventListener("focus", () => {
    if (!suppressFocus) openEvent(index);
  });
  button.addEventListener("click", () => {
    if (activeEvent === index && pinned) closePreview();
    else openEvent(index, true);
  });
  button.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    e.stopPropagation();
    const next = clamp(
      index + (e.key === "ArrowRight" ? 1 : -1),
      0,
      events.length - 1,
    );
    goToEvent(next);
    suppressFocus = true;
    eventButtons[next].focus({ preventScroll: true });
    suppressFocus = false;
  });
});
document.addEventListener("pointermove", (event) => {
  if (
    !hoverDismissed ||
    event.pointerType !== "mouse" ||
    (!event.movementX && !event.movementY)
  )
    return;
  hoverDismissed = false;
  if (pinned) return;
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "[data-ruler], [data-painter], [data-event]",
  );
  if (!target) return;
  if (target.dataset.event) openEvent(eventButtons.indexOf(target));
  else if (target.dataset.painter) openPainter(painterButtons.indexOf(target));
  else openPreview(buttons.indexOf(target));
});
updateScale(START_YEAR, padding());
