import { test, expect } from "@playwright/test";
import { events } from "../src/data/events";
import { artworks } from "../src/data/artworks";
import { painters } from "../src/data/painters";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("every painter has two real, loadable artworks with attribution", async ({
  page,
}) => {
  expect(artworks).toHaveLength(72);
  expect(new Set(artworks.map((a) => a.id)).size).toBe(72);
  for (const painter of painters) {
    const works = artworks.filter((a) => a.painter === painter.id);
    expect(works).toHaveLength(2);
    for (const work of works) {
      expect(work.source).toMatch(/^https:\/\//);
      expect(work.credit.length).toBeGreaterThan(2);
    }
    await page.locator("#painter-picker").selectOption(painter.id);
    await expect(page.locator("#artwork-gallery figure")).toHaveCount(2);
    await expect
      .poll(() =>
        page
          .locator("#artwork-gallery img")
          .evaluateAll((nodes) =>
            nodes.every(
              (n) =>
                (n as HTMLImageElement).complete &&
                (n as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    await expect(page.locator("#artwork-gallery .art-credit")).toHaveCount(2);
    await page.keyboard.press("Escape");
  }
});

test("events distinguish world war dates and later artistic depictions, linking to rulers and authors", async ({
  page,
}) => {
  for (const e of events) {
    expect(e.end).toBeGreaterThan(e.start);
    for (const ref of e.art)
      expect(artworks.some((a) => a.id === ref.id)).toBe(true);
  }
  await page.locator("#event-picker").selectOption("ww2");
  await expect(page.locator("#preview-dates")).toContainText("1939");
  await expect(page.locator("#artwork-gallery")).toContainText(
    "Оборона Севастополя",
  );
  await page.locator("#contemporaries summary").click();
  await page
    .locator("#contemporary-links")
    .getByRole("button", { name: /Иосиф Сталин/ })
    .click();
  await expect(page.locator("#preview-name")).toHaveText("Иосиф Сталин");
  await expect(page.locator("#artwork-gallery")).toBeHidden();
  await page.locator("#related-events summary").click();
  await page
    .locator("#event-links")
    .getByRole("button", { name: /Великая Отечественная война/ })
    .click();
  await expect(page.locator("#preview-dates")).toContainText("1941");
  await expect(page.locator("#preview-accession")).toContainText(
    "часть Второй мировой",
  );
  await page.keyboard.press("Escape");
  await page.locator("#event-picker").selectOption("streltsy");
  await expect(page.locator("#preview-dates")).toHaveText("1698");
  await expect(page.locator("#artwork-gallery")).toContainText("1881");
  await expect(page.locator("#artwork-gallery")).toContainText(
    "Позднейшее изображение",
  );
  await page
    .locator("#artwork-gallery")
    .getByRole("button", { name: "Василий Суриков →" })
    .click();
  await expect(page.locator("#preview-name")).toHaveText("Василий Суриков");
  await page.locator("#related-events summary").click();
  await expect(page.locator("#event-links")).toContainText(
    "Стрелецкий бунт и казни",
  );
});

test("event cards support touch/click, keyboard, scrolling and fixed close controls", async ({
  page,
  isMobile,
}) => {
  await page.locator("#event-picker").selectOption("great-patriotic");
  await page.keyboard.press("Escape");
  const bar = page.locator('[data-event="great-patriotic"]');
  if (isMobile) await bar.tap();
  else {
    await bar.click();
  }
  await expect(page.locator("#preview-name")).toHaveText(
    "Великая Отечественная война",
  );
  await page.locator("#preview-departure").scrollIntoViewIfNeeded();
  await expect(page.getByRole("dialog")).toBeInViewport({ ratio: 1 });
  const card = await page.getByRole("dialog").boundingBox();
  const size = page.viewportSize()!;
  expect(card!.x).toBeGreaterThanOrEqual(0);
  expect(card!.x + card!.width).toBeLessThanOrEqual(size.width);
  expect(card!.y + card!.height).toBeLessThanOrEqual(size.height);
  await page.getByRole("button", { name: "Закрыть справку" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(bar).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(page.locator("#preview-name")).toHaveText("Блокада Ленинграда");
  await expect(page.locator("#artwork-gallery")).toBeHidden();
  await expect(page.locator("#preview-departure")).toContainText(
    "пока нет проверенной связи",
  );
});

test("cards across every category do not collide and point events stay selectable", async ({
  page,
}) => {
  await page.locator("#event-picker").selectOption("october-1917");
  await page.keyboard.press("Escape");
  for (const zoom of ["0", "1", "2", "3", "4", "5", "6", "7"]) {
    await page.locator("#zoom").fill(zoom);
    const rects = await page
      .locator(".timeline-card")
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getBoundingClientRect().toJSON()),
      );
    const collisions = [];
    for (let a = 0; a < rects.length; a++)
      for (let b = a + 1; b < rects.length; b++) {
        const x = rects[a],
          y = rects[b];
        if (!(
          x.right <= y.left ||
          y.right <= x.left ||
          x.bottom <= y.top ||
          y.bottom <= x.top
        ))
          collisions.push([a, b]);
      }
    expect(collisions).toEqual([]);
  }
  await page.locator("#event-picker").selectOption("gagarin");
  await expect(page.locator("#preview-name")).toHaveText(
    "Первый полёт человека в космос",
  );
  await page.getByRole("button", { name: "Закрыть справку" }).click();
  await page.locator('[data-event="gagarin"]').click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
