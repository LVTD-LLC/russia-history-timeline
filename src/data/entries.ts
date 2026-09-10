import { timeline } from "./timeline";
import { events } from "./events";
import { painters } from "./painters";

export const entries = [
  ...timeline.map((item) => ({
    ...item,
    category: "ruler" as const,
    label: item.kind === "context" ? "Период" : "Правитель",
  })),
  ...events.map((item) => ({
    ...item,
    kind: "event",
    category: "event" as const,
    label: "Событие",
  })),
  ...painters.map((item) => ({
    ...item,
    kind: "painter",
    category: "painter" as const,
    label: "Художник",
  })),
].sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));

if (new Set(entries.map((entry) => entry.id)).size !== entries.length)
  throw new Error("Timeline URLs must be unique across all categories");
