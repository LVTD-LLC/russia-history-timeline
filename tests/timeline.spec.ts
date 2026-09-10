import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("Russian-language atlas, one shared canvas, no document overflow", async ({
  page,
}) => {
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(
    page.getByRole("heading", { name: "Russia History Timeline", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".timeline-viewport")).toHaveCount(1);
  await expect(page.locator("[data-ruler]")).toHaveCount(84);
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
  expect(rows).toBeGreaterThan(1);
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
  await expect(page.getByRole("dialog")).toBeInViewport({ ratio: 1 });
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
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(page.locator("#preview-name")).toHaveText("Олег Вещий");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("hover and keyboard focus never open details", async ({
  page,
  isMobile,
}) => {
  for (const id of ["rurik", "rublev", "ww2"]) {
    await page.goto(`/${id}/`);
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Закрыть справку" }).click();
    const card = page.locator(`#${id}`);
    await card.focus();
    await expect(page.getByRole("dialog")).toBeHidden();
    if (!isMobile) {
      await card.hover();
      await expect(page.getByRole("dialog")).toBeHidden();
    }
    await card.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
  }
});

test("drawer URLs survive reload and Back/Forward; closing preserves the timeline", async ({
  page,
  isMobile,
}) => {
  await page.locator("#painter-picker").selectOption("repin");
  await expect(page).toHaveURL(/\/repin\/$/);
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("dialog")).toBeHidden();
  const position = await page
    .locator("#timeline")
    .evaluate((el) => [el.scrollLeft, el.scrollTop]);
  await page.locator("#repin").click({ position: { x: 20, y: 20 } });
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toBeInViewport({ ratio: 1 });
  const box = await page.getByRole("dialog").boundingBox();
  expect(box!.width).toBe(page.viewportSize()!.width * (isMobile ? 1 : 0.5));
  expect(box!.height).toBe(page.viewportSize()!.height);
  await page.getByRole("button", { name: "Закрыть справку" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(
    await page
      .locator("#timeline")
      .evaluate((el) => [el.scrollLeft, el.scrollTop]),
  ).toEqual(position);
  await page.goForward();
  await expect(page.locator("#preview-name")).toHaveText("Илья Репин");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.reload();
  await expect(page.locator("#preview-name")).toHaveText("Илья Репин");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("modal keeps keyboard focus inside and backdrop dismisses on desktop", async ({
  page,
  isMobile,
}) => {
  await page.locator("#rurik").click();
  await expect(page.locator("#close-preview")).toBeFocused();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page
        .getByRole("dialog")
        .evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }
  if (!isMobile) await page.mouse.click(20, 20);
  else await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("#rurik")).toBeFocused();
});
