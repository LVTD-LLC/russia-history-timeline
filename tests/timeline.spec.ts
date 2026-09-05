import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("Russian-only, one lane, no document overflow", async ({ page }) => {
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(
    page.getByRole("heading", { name: "Правители России", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".ruler-line")).toHaveCount(1);
  await expect(page.locator("[data-ruler]")).toHaveCount(67);
  await expect(page.locator("body")).not.toContainText("English");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const rows = await page
    .locator("[data-ruler]")
    .evaluateAll(
      (nodes) => new Set(nodes.map((n) => n.getBoundingClientRect().top)).size,
    );
  expect(rows).toBe(1);
});

test("tap or click opens a card, navigates and closes", async ({
  page,
  isMobile,
}) => {
  const ruler = page.locator("#rurik");
  if (isMobile) await ruler.tap();
  else await ruler.click();
  const card = page.getByRole("dialog");
  await expect(card).toBeVisible();
  await expect(card.getByRole("heading")).toHaveText("Рюрик");
  await expect(card.locator("#preview-intro")).toContainText("Рюриковичей");
  const box = await card.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
  await card.getByRole("button", { name: "Следующий правитель" }).click();
  await expect(card.getByRole("heading")).toHaveText("Олег Вещий");
  await card.getByRole("button", { name: "Закрыть справку" }).click();
  await expect(card).toBeHidden();
});

test("zoom changes real time scale and keeps the viewed year", async ({
  page,
}) => {
  await page.locator("#ruler-picker").selectOption("catherine-ii");
  await page.keyboard.press("Escape");
  const centerYear = () =>
    page.locator("#timeline").evaluate((el) => {
      const track = document.getElementById("timeline-track")!;
      return (
        862 +
        (el.scrollLeft +
          el.clientWidth / 2 -
          parseFloat(getComputedStyle(track).marginLeft)) /
          parseFloat(getComputedStyle(track).getPropertyValue("--scale"))
      );
    });
  const before = await centerYear();
  const widthBefore = await page
    .locator("#catherine-ii")
    .evaluate((el) => el.getBoundingClientRect().width);
  await page.getByRole("button", { name: "Увеличить масштаб" }).click();
  await expect(page.locator("#zoom")).toHaveValue("3");
  const widthAfter = await page
    .locator("#catherine-ii")
    .evaluate((el) => el.getBoundingClientRect().width);
  expect(widthAfter / widthBefore).toBeCloseTo(2, 1);
  expect(Math.abs((await centerYear()) - before)).toBeLessThan(1);
});

test("short reign picker and overview reach both ends", async ({ page }) => {
  await page.locator("#ruler-picker").selectOption("fyodor-ii");
  await expect(page.locator("#preview-name")).toHaveText("Фёдор II Годунов");
  await expect(page.locator("#preview-dates")).toHaveText("апрель — июнь 1605");
  await page.keyboard.press("Escape");
  await page.locator("#position").fill("1000");
  await expect(page.locator("#visible-years")).toContainText(
    String(new Date().getFullYear()),
  );
  await page.locator("#ruler-picker").selectOption("putin-ii");
  await expect(page.locator("#preview-name")).toHaveText("Владимир Путин");
  await expect(
    page.getByRole("button", { name: "Следующий правитель" }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await page.locator("#position").fill("0");
  await expect(page.locator("#visible-years")).toContainText("862");
});

test("era navigation and keyboard cards", async ({ page }) => {
  await page
    .getByRole("button", { name: "Российская империя", exact: true })
    .click();
  await expect
    .poll(() => page.locator("#timeline").evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(6000);
  await page.locator("#rurik").focus();
  await expect(page.locator("#preview-name")).toHaveText("Рюрик");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#preview-name")).toHaveText("Олег Вещий");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("mouse hover card remains available when moving into it", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Hover is a desktop interaction");
  await page.locator("#rurik").hover();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").hover();
  await expect(page.locator("#preview-intro")).toBeVisible();
  await page
    .getByRole("heading", { name: "Правители России", exact: true })
    .hover();
  await expect(page.getByRole("dialog")).toBeHidden();
});
