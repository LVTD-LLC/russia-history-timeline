import { test, expect } from "@playwright/test";
import { rulers, timeline, START_YEAR, END_YEAR } from "../src/data/timeline";

test("the chronology has no unexplained date gaps and every reign has transfer details", () => {
  expect(rulers).toHaveLength(79);
  expect(new Set(timeline.map((item) => item.id)).size).toBe(timeline.length);
  expect(timeline[0].start).toBe(START_YEAR);
  expect(timeline.at(-1)!.end).toBe(END_YEAR);
  for (const [index, item] of timeline.entries()) {
    expect(item.end, item.id).toBeGreaterThan(item.start);
    expect(item.accession.length, item.id).toBeGreaterThan(30);
    expect(item.departure.length, item.id).toBeGreaterThan(30);
    if (index > 0)
      expect(item.start, `Gap before ${item.id}`).toBeLessThanOrEqual(
        timeline[index - 1].end,
      );
  }
});

test("Mstislav leads to Yaropolk, with returns to the Kiev throne represented", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#ruler-picker").selectOption("mstislav");
  await expect(page.locator("#preview-departure")).toContainText("Ярополку");
  await page.getByRole("button", { name: "Следующий правитель" }).click();
  await expect(page.locator("#preview-name")).toHaveText(
    "Ярополк Владимирович",
  );
  await expect(page.locator("#preview-dates")).toHaveText("1132–1139");
  await page.getByRole("button", { name: "Закрыть справку" }).click();
  await page.locator("#ruler-picker").selectOption("yuri-first");
  await expect(page.locator("#preview-title")).toContainText(
    "первое правление",
  );
  await expect(page.locator("#preview-departure")).toContainText("Вячеслав");
  await page.getByRole("button", { name: "Закрыть справку" }).click();
  await page.locator("#ruler-picker").selectOption("izyaslav-third");
  await expect(page.locator("#preview-intro")).toContainText("соправление");
});

test("normal succession and coups have distinct, readable transfer explanations", async ({
  page,
}) => {
  await page.goto("/");
  for (const [id, accession, departure] of [
    ["catherine-ii", "переворота", "Павел I"],
    ["paul", "смерти матери", "Убит заговорщиками"],
    ["nicholas-ii", "смерти отца", "Отрёкся"],
    ["khrushchev", "Избран", "отстранён"],
    ["putin-ii", "выборах 2012", "Правление продолжается"],
  ]) {
    await page.locator("#ruler-picker").selectOption(id);
    await expect(page.locator("#accession-label")).toHaveText(
      "Приход к власти",
    );
    await expect(page.locator("#preview-accession")).toContainText(accession);
    await expect(page.locator("#preview-departure")).toContainText(departure);
    await page.locator("#preview-departure").scrollIntoViewIfNeeded();
    await expect(page.locator("#preview-departure")).toBeVisible();
    const card = await page.locator("#ruler-preview").boundingBox();
    expect(card!.x + card!.width).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
    await expect(
      page.getByRole("button", { name: "Закрыть справку" }),
    ).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "Следующий правитель" }),
    ).toBeInViewport();
    await page.getByRole("button", { name: "Закрыть справку" }).click();
  }
});

test("context bands explain interregnum and changes of political center", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#ruler-picker").selectOption("gap-1610");
  await expect(page.locator("#gap-1610")).toHaveClass(/context-period/);
  await expect(page.locator("#accession-label")).toHaveText("Начало периода");
  await expect(page.locator("#preview-intro")).toContainText("Семибоярщина");
  await expect(page.locator("#preview-departure")).toContainText(
    "Земский собор",
  );
  await page.getByRole("button", { name: "Следующий правитель" }).click();
  await expect(page.locator("#preview-name")).toHaveText("Михаил Фёдорович");
  await expect(page.locator("#accession-label")).toHaveText("Приход к власти");
  await page.getByRole("button", { name: "Закрыть справку" }).click();
  await page.locator("#ruler-picker").selectOption("gap-1263");
  await expect(page.locator("#preview-departure")).toContainText(
    "не был непосредственным преемником",
  );
});
