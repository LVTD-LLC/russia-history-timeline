import { events } from "../data/events";
import { artworks, type Artwork } from "../data/artworks";
import { painters, overlaps } from "../data/painters";
import {
  timeline as items,
  eras,
  START_YEAR,
  END_YEAR,
} from "../data/timeline";
import { entries } from "../data/entries";

const element = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const viewport = element<HTMLDivElement>("timeline");
const track = element<HTMLDivElement>("timeline-track");
const zoom = element<HTMLInputElement>("zoom");
const position = element<HTMLInputElement>("position");
const picker = element<HTMLSelectElement>("ruler-picker");
const painterPicker = element<HTMLSelectElement>("painter-picker");
const eventPicker = element<HTMLSelectElement>("event-picker");
const preview = element<HTMLDialogElement>("ruler-preview");
const buttons = items.map((item) => element<HTMLAnchorElement>(item.id));
const painterButtons = painters.map((item) =>
  element<HTMLAnchorElement>(item.id),
);
const eventButtons = events.map((item) => element<HTMLAnchorElement>(item.id));
const cards = entries.map((item) => element<HTMLAnchorElement>(item.id));
const eraButtons = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-era]"),
];
const ticks = [...document.querySelectorAll<HTMLElement>(".year-tick")];
const scales = [2, 4, 8, 16, 32, 64, 128, 256];
let scale = scales[Number(zoom.value)];
let active = -1,
  activePainter = -1,
  activeEvent = -1;
let readingHistory = false;
const activeButton = () =>
  activeEvent >= 0
    ? eventButtons[activeEvent]
    : activePainter >= 0
      ? painterButtons[activePainter]
      : buttons[active];
const motion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
const padding = () => parseFloat(getComputedStyle(track).marginLeft);
const yearAt = (x: number) =>
  START_YEAR + (viewport.scrollLeft + x - padding()) / scale;
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

function layoutEntries() {
  // One row allocator for every category. Reserve readable label width, not just duration.
  const ends: number[] = [];
  const first = yearAt(0);
  entries.forEach((entry, index) => {
    const start = (entry.start - START_YEAR) * scale;
    const labelOffset = Math.max(0, (first - entry.start) * scale + 8);
    const duration = (entry.end - entry.start) * scale;
    const inView =
      entry.end > first && entry.start < yearAt(viewport.clientWidth);
    const width = Math.max(200, duration, inView ? labelOffset + 200 : 0);
    let row = ends.findIndex((end) => end + 12 <= start);
    if (row < 0) row = ends.length;
    ends[row] = start + width;
    const card = cards[index];
    card.style.top = `${64 + row * 104}px`;
    card.style.width = `${width}px`;
    card.querySelector<HTMLElement>(".card-copy")!.style.left =
      `${inView ? labelOffset : 8}px`;
  });
  track.style.height = `${Math.max(360, 80 + ends.length * 104)}px`;
}
function revealDetails() {
  const wasOpen = preview.open;
  if (!wasOpen) {
    preview.showModal();
    document.body.classList.add("details-open");
  }
  element("close-preview").focus({ preventScroll: true });
  const id = activeButton().id;
  document.title = `${element("preview-name").textContent} — Исторический атлас`;
  if (!readingHistory && location.pathname !== `/${id}/`) {
    // Related entries replace the detail URL so Back returns straight to the timeline.
    if (wasOpen)
      history.replaceState(history.state, "", `/${id}/${location.search}`);
    else
      history.pushState(
        { timelineDrawer: true },
        "",
        `/${id}/${location.search}`,
      );
  }
}
function closePreview(restoreFocus = true, updateHistory = true) {
  if (!preview.open) return;
  const previous = activeButton();
  preview.close();
  document.body.classList.remove("details-open");
  previous?.setAttribute("aria-expanded", "false");
  active = activePainter = activeEvent = -1;
  document.title = "Правители России — линия времени";
  if (updateHistory) {
    if (history.state?.timelineDrawer) history.back();
    else history.replaceState(null, "", `/${location.search}`);
  }
  if (restoreFocus) previous?.focus({ preventScroll: true });
}
function goTo(kind: "ruler" | "painter" | "event", index: number) {
  const list =
    kind === "ruler" ? items : kind === "painter" ? painters : events;
  const item = list[index];
  if (!item) return;
  viewport.scrollLeft =
    (item.start - START_YEAR) * scale + padding() - viewport.clientWidth * 0.25;
  updateView();
  viewport.scrollTop = Math.max(0, parseFloat(element(item.id).style.top) - 64);
  if (kind === "ruler") openPreview(index);
  else if (kind === "painter") openPainter(index);
  else openEvent(index);
}
const goToRuler = (index: number) => goTo("ruler", index);
const goToPainter = (index: number) => goTo("painter", index);
const goToEvent = (index: number) => goTo("event", index);

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
  layoutEntries();
}
function updateScale(
  anchorYear = yearAt(viewport.clientWidth / 2),
  anchorX = viewport.clientWidth / 2,
) {
  scale = scales[Number(zoom.value)];
  track.style.setProperty("--scale", `${scale}px`);
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
function openPreview(index: number) {
  activeButton()?.setAttribute("aria-expanded", "false");
  activeEvent = -1;
  activePainter = -1;
  active = index;
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
  preview.style.setProperty("--preview-color", "#805141");
  buttons[index].setAttribute("aria-expanded", "true");
  picker.value = ruler.id;
  element("previous-ruler").setAttribute("aria-label", "Предыдущий правитель");
  element("next-ruler").setAttribute("aria-label", "Следующий правитель");
  showGallery([]);
  showRelatedEvents("ruler", index);
  showContemporaries(false, index);
  revealDetails();
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

function openPainter(index: number) {
  activeButton()?.setAttribute("aria-expanded", "false");
  active = -1;
  activeEvent = -1;
  activePainter = index;
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
  preview.style.setProperty("--preview-color", "#356a69");
  painterButtons[index].setAttribute("aria-expanded", "true");
  painterPicker.value = painter.id;
  showGallery(artworks.filter((a) => a.painter === painter.id));
  showRelatedEvents("painter", index);
  showContemporaries(true, index);
  revealDetails();
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

function openEvent(index: number) {
  activeButton()?.setAttribute("aria-expanded", "false");
  active = -1;
  activePainter = -1;
  activeEvent = index;
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
  preview.style.setProperty("--preview-color", "#97631b");
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
  revealDetails();
}

for (const [kind, list, controls, select] of [
  ["ruler", items, buttons, picker],
  ["painter", painters, painterButtons, painterPicker],
  ["event", events, eventButtons, eventPicker],
] as const) {
  select.addEventListener("change", () =>
    goTo(
      kind,
      list.findIndex((item) => item.id === select.value),
    ),
  );
  controls.forEach((card, index) => {
    card.addEventListener("click", (event) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      )
        return;
      event.preventDefault();
      // Do not pan on a card click: the backdrop stays exactly where the reader left it.
      if (kind === "ruler") openPreview(index);
      else if (kind === "painter") openPainter(index);
      else openEvent(index);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === " ") {
        event.preventDefault();
        card.click();
      }
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      const next = clamp(
        index + (event.key === "ArrowRight" ? 1 : -1),
        0,
        controls.length - 1,
      );
      controls[next].focus();
    });
  });
}
element("close-preview").addEventListener("click", () => closePreview());
preview.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const focusable = [
    ...preview.querySelectorAll<HTMLElement>(
      "a[href], button:not(:disabled), summary, [tabindex='0']",
    ),
  ].filter((node) => node.getClientRects().length > 0);
  const first = focusable[0],
    last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
});
preview.addEventListener("cancel", (event) => {
  event.preventDefault();
  closePreview();
});
preview.addEventListener("click", (event) => {
  if (event.target !== preview) return;
  const rect = preview.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    closePreview();
});
for (const [id, direction] of [
  ["previous-ruler", -1],
  ["next-ruler", 1],
] as const)
  element(id).addEventListener("click", () =>
    activeEvent >= 0
      ? goToEvent(activeEvent + direction)
      : activePainter >= 0
        ? goToPainter(activePainter + direction)
        : goToRuler(active + direction),
  );
zoom.addEventListener("input", () => updateScale());
for (const [id, delta] of [
  ["zoom-out", -1],
  ["zoom-in", 1],
] as const)
  element(id).addEventListener("click", () => {
    zoom.value = String(
      clamp(Number(zoom.value) + delta, 0, scales.length - 1),
    );
    updateScale();
  });
position.addEventListener("input", () => {
  viewport.scrollLeft =
    (Number(position.value) / 1000) *
    (viewport.scrollWidth - viewport.clientWidth);
  updateView();
});
eraButtons.forEach((button) =>
  button.addEventListener("click", () => {
    viewport.scrollTop = 0;
    viewport.scrollTo({
      left: (Number(button.dataset.year) - START_YEAR) * scale,
      behavior: motion(),
    });
  }),
);
for (const [id, direction] of [
  ["pan-back", -1],
  ["pan-forward", 1],
] as const)
  element(id).addEventListener("click", () =>
    viewport.scrollBy({
      left: viewport.clientWidth * 0.75 * direction,
      behavior: motion(),
    }),
  );
viewport.addEventListener("keydown", (event) => {
  if (
    event.target !== viewport ||
    !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
  )
    return;
  event.preventDefault();
  if (event.key === "Home" || event.key === "End")
    viewport.scrollTo({
      left: event.key === "Home" ? 0 : viewport.scrollWidth,
      behavior: motion(),
    });
  else
    viewport.scrollBy({
      left: viewport.clientWidth * 0.5 * (event.key === "ArrowRight" ? 1 : -1),
      behavior: motion(),
    });
});
viewport.addEventListener("scroll", updateView, { passive: true });
new ResizeObserver(updateView).observe(viewport);
function readRoute() {
  readingHistory = true;
  const id = location.pathname.split("/").filter(Boolean)[0];
  const entry = entries.find((item) => item.id === id);
  if (entry) {
    const list =
      entry.category === "ruler"
        ? items
        : entry.category === "event"
          ? events
          : painters;
    goTo(
      entry.category,
      list.findIndex((item) => item.id === id),
    );
  } else closePreview(true, false);
  readingHistory = false;
}
window.addEventListener("popstate", readRoute);
updateScale(START_YEAR, padding());
readRoute();
