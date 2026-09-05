import { rulers, eras, START_YEAR, END_YEAR } from "../data/timeline";

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
let active = -1;
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
  if (active < 0 || preview.hidden || matchMedia("(max-width: 640px)").matches)
    return;
  const rect = buttons[active].getBoundingClientRect();
  const box = viewport.getBoundingClientRect();
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
  const previous = active;
  preview.hidden = true;
  if (previous >= 0) buttons[previous].setAttribute("aria-expanded", "false");
  active = -1;
  pinned = false;
  if (restoreFocus && previous >= 0) {
    suppressFocus = true;
    buttons[previous].focus({ preventScroll: true });
    suppressFocus = false;
  }
}
function openPreview(index: number, pin = false) {
  clearTimeout(closeTimer);
  if (active >= 0) buttons[active].setAttribute("aria-expanded", "false");
  active = index;
  pinned = pin;
  const ruler = rulers[index];
  const era = eras.find((e) => e.id === ruler.era)!;
  element("preview-era").textContent = era.name;
  element("preview-dates").textContent = ruler.dates;
  element("preview-name").textContent = ruler.name;
  element("preview-title").textContent = ruler.title;
  element("preview-intro").textContent = ruler.intro;
  element("preview-count").textContent = `${index + 1} из ${rulers.length}`;
  element<HTMLButtonElement>("previous-ruler").disabled = index === 0;
  element<HTMLButtonElement>("next-ruler").disabled =
    index === rulers.length - 1;
  preview.style.setProperty("--preview-color", era.color);
  buttons[index].setAttribute("aria-expanded", "true");
  preview.hidden = false;
  picker.value = ruler.id;
  placePreview();
}
function scheduleClose() {
  if (!pinned) closeTimer = setTimeout(() => closePreview(), 220);
}
function updateView() {
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
  placePreview();
}
function updateScale(
  anchorYear = yearAt(viewport.clientWidth / 2),
  anchorX = viewport.clientWidth / 2,
) {
  scale = scales[Number(zoom.value)];
  track.style.setProperty("--scale", `${scale}px`);
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
  const ruler = rulers[index];
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
        rulers.length - 1,
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
  goToRuler(active - 1),
);
element("next-ruler").addEventListener("click", () => goToRuler(active + 1));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !preview.hidden) closePreview(true);
});
document.addEventListener("pointerdown", (event) => {
  const target = event.target as HTMLElement;
  if (
    !preview.contains(target) &&
    !target.closest("[data-ruler]") &&
    !target.closest(".zoom-control")
  )
    closePreview();
});
document.addEventListener("focusin", (event) => {
  const target = event.target as HTMLElement;
  if (
    !preview.contains(target) &&
    !target.closest("[data-ruler]") &&
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
  const index = rulers.findIndex((r) => r.id === picker.value);
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
viewport.addEventListener("keydown", (event) => {
  if (event.target !== viewport) return;
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
new ResizeObserver(updateView).observe(viewport);
updateScale(START_YEAR, padding());
