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
let mirroredPainterScroll = -1;
let activePainter = -1;
let active = -1;
const activeButton = () =>
  activePainter >= 0 ? painterButtons[activePainter] : buttons[active];
let pinned = false;
let closeTimer: ReturnType<typeof setTimeout>;
let suppressFocus = false;
const motion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
const padding = () => parseFloat(getComputedStyle(track).marginLeft);
const yearAt = (x: number) =>
  START_YEAR + (viewport.scrollLeft + x - padding()) / scale;
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

function placePreview() {
  if (
    (active < 0 && activePainter < 0) ||
    preview.hidden ||
    matchMedia("(max-width: 640px)").matches
  )
    return;
  const rect = activeButton().getBoundingClientRect();
  const box = (
    activePainter >= 0 ? painterViewport : viewport
  ).getBoundingClientRect();
  const anchor = clamp(
    rect.left + Math.min(rect.width / 2, 150),
    box.left + 30,
    box.right - 30,
  );
  preview.style.left = `${clamp(anchor - preview.offsetWidth / 2, 12, innerWidth - preview.offsetWidth - 12)}px`;
  const below = rect.bottom + 12;
  preview.style.top = `${clamp(below + preview.offsetHeight < innerHeight ? below : rect.top - preview.offsetHeight - 12, 12, innerHeight - preview.offsetHeight - 12)}px`;
}
function closePreview(restoreFocus = false) {
  clearTimeout(closeTimer);
  const previous = activeButton();
  preview.hidden = true;
  previous?.setAttribute("aria-expanded", "false");
  active = -1;
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
  showContemporaries(false, index);
  placePreview();
}
function scheduleClose() {
  if (!pinned) closeTimer = setTimeout(() => closePreview(), 220);
}
function updateView() {
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
  placePreview();
}
function updateScale(
  anchorYear = yearAt(viewport.clientWidth / 2),
  anchorX = viewport.clientWidth / 2,
) {
  scale = scales[Number(zoom.value)];
  track.style.setProperty("--scale", `${scale}px`);
  painterTrack.style.setProperty("--scale", `${scale}px`);
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
    if (event.pointerType === "mouse" && !pinned) openPreview(index);
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
  activePainter >= 0 ? goToPainter(activePainter - 1) : goToRuler(active - 1),
);
element("next-ruler").addEventListener("click", () =>
  activePainter >= 0 ? goToPainter(activePainter + 1) : goToRuler(active + 1),
);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !preview.hidden) closePreview(true);
});
document.addEventListener("pointerdown", (event) => {
  const target = event.target as HTMLElement;
  if (
    !preview.contains(target) &&
    !target.closest("[data-ruler], [data-painter]") &&
    !target.closest(".zoom-control")
  )
    closePreview();
});
document.addEventListener("focusin", (event) => {
  const target = event.target as HTMLElement;
  if (
    !preview.contains(target) &&
    !target.closest("[data-ruler], [data-painter]") &&
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
for (const scrollport of [viewport, painterViewport])
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
    if (event.pointerType === "mouse" && !pinned) openPainter(index);
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
updateScale(START_YEAR, padding());
