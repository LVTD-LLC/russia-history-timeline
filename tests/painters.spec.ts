import { test, expect } from "@playwright/test";
import { painters, painterRows, overlaps } from "../src/data/painters";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("lifespans retain their full length and overlapping painters get separate rows", async ({
  page,
}) => {
  expect(painters.length).toBe(36);
  expect(new Set(painters.map((p) => p.id)).size).toBe(painters.length);
  for (const p of painters) {
    expect(p.end).toBeGreaterThan(p.start);
    expect(p.connection.length).toBeGreaterThan(20);
  }
  const rows = painterRows(painters);
  for (const a of rows)
    for (const b of rows)
      if (a.painter.id !== b.painter.id && overlaps(a.painter, b.painter))
        expect(a.row).not.toBe(b.row);
  await expect(page.locator("#painters-empty")).toBeVisible();
  await page.locator('[data-painter-year="1840"]').click();
  await expect(page.locator("#painters-empty")).toBeHidden();
  const bands = await page
    .locator("[data-painter]:visible")
    .evaluateAll((nodes) =>
      nodes.map((n) => ({
        x: n.getBoundingClientRect().x,
        y: n.getBoundingClientRect().y,
        width: n.getBoundingClientRect().width,
        start: Number((n as HTMLElement).dataset.start),
        end: Number((n as HTMLElement).dataset.end),
      })),
    );
  for (const a of bands) {
    expect(a.width).toBeCloseTo((a.end - a.start) * 8, 0);
    for (const b of bands)
      if (a !== b && overlaps(a, b)) expect(a.y).not.toBe(b.y);
  }
});

test("both scroll directions and every zoom keep year coordinates aligned", async ({
  page,
}) => {
  const alignment = async () =>
    page.evaluate(() => {
      const a = document.getElementById("timeline")!,
        b = document.getElementById("painters-timeline")!;
      const x = document
        .querySelector('#timeline-track [data-year="1900"]')!
        .getBoundingClientRect().x;
      const y = document
        .querySelector('#painters-track [data-year="1900"]')!
        .getBoundingClientRect().x;
      return Math.max(Math.abs(a.scrollLeft - b.scrollLeft), Math.abs(x - y));
    });
  await page.locator('[data-painter-year="1910"]').click();
  for (let z = 0; z < 8; z++) {
    await page.locator("#zoom").fill(String(z));
    await expect.poll(alignment).toBeLessThan(2);
    await page
      .locator("#painters-timeline")
      .evaluate((el) => (el.scrollLeft -= 137));
    await expect.poll(alignment).toBeLessThan(2);
    await page.locator("#timeline").evaluate((el) => (el.scrollLeft += 81));
    await expect.poll(alignment).toBeLessThan(2);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("painter cards explain residence, navigate and link to contemporary rulers", async ({
  page,
}) => {
  await page.locator("#painter-picker").selectOption("vigee-lebrun");
  await expect(page.locator("#preview-name")).toHaveText(
    "Элизабет Виже-Лебрен",
  );
  await expect(page.locator("#preview-accession")).toContainText("1795–1801");
  await page.locator("#contemporaries summary").click();
  const links = page.locator("#contemporary-links");
  await expect(links).toContainText("Екатерина II");
  await expect(links).not.toContainText("Пётр I ·");
  await links.getByRole("button", { name: /Екатерина II/ }).click();
  await expect(page.locator("#preview-name")).toHaveText(
    "Екатерина II Великая",
  );
  await expect(page.locator("#accession-label")).toHaveText("Приход к власти");
  await page.locator("#contemporaries summary").click();
  await links.getByRole("button", { name: /Фёдор Рокотов/ }).click();
  await expect(page.locator("#preview-name")).toHaveText("Фёдор Рокотов");
  await page.getByRole("button", { name: "Следующий художник" }).click();
  await expect(page.locator("#preview-name")).toHaveText("Дмитрий Левицкий");
  const box = await page.getByRole("dialog").boundingBox();
  const size = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(size.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(size.height);
  await page.getByRole("button", { name: "Закрыть справку" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator('[data-painter="levitsky"]')).toBeFocused();
});

test("painter bars support touch or hover, keyboard and dense vertical scrolling", async ({
  page,
  isMobile,
}) => {
  await page.locator('[data-painter-year="1360"]').click();
  const bar = page.locator('[data-painter="rublev"]');
  if (isMobile) await bar.tap();
  else await bar.hover();
  await expect(page.locator("#preview-name")).toHaveText("Андрей Рублёв");
  await page.keyboard.press("Escape");
  await bar.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#preview-name")).toHaveText("Симон Ушаков");
  await page.keyboard.press("Escape");
  await page.locator("#painter-picker").selectOption("chagall");
  await expect(page.locator("#preview-name")).toHaveText("Марк Шагал");
  await page.keyboard.press("Escape");
  expect(
    await page.locator("#painters-timeline").evaluate((el) => el.scrollTop),
  ).toBeGreaterThan(0);
  await page.locator('[data-painter="chagall"]').click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("#preview-accession")).toContainText("1922");
});

test("touch swipe on painters moves the rulers too", async ({
  page,
  isMobile,
  context,
}) => {
  test.skip(!isMobile, "Touch gesture is exercised on phones");
  await page.locator('[data-painter-year="1840"]').tap();
  await page.locator("#painters-timeline").scrollIntoViewIfNeeded();
  const box = (await page.locator("#painters-timeline").boundingBox())!;
  const before = await page
    .locator("#timeline")
    .evaluate((el) => el.scrollLeft);
  const cdp = await context.newCDPSession(page);
  const x = box.x + box.width * 0.8,
    y = box.y + 70;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let i = 1; i <= 6; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x - i * 20, y }],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() => page.locator("#timeline").evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(before + 30);
  await expect
    .poll(() =>
      page.evaluate(() =>
        Math.abs(
          document.getElementById("timeline")!.scrollLeft -
            document.getElementById("painters-timeline")!.scrollLeft,
        ),
      ),
    )
    .toBeLessThan(2);
  await cdp.detach();
});
