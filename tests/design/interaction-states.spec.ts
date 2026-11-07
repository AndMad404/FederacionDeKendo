import { expect, test } from "@playwright/test";

import { FIXED_TEST_TIME } from "./design-contract";

test("hero actions share depth and pressure with colors suited to the photo", async ({
  page,
}) => {
  await page.goto("/");
  const secondary = page
    .locator("main")
    .getByRole("link", { name: "Encuentra un dojo", exact: true });
  const primary = page
    .locator("main")
    .getByRole("link", { name: "Calendario de Próximos Eventos", exact: true });
  const archive = page
    .locator("main > section > header")
    .getByRole("link", { name: "Eventos pasados", exact: true });
  await expect(secondary).toHaveCSS("background-color", "rgb(200, 16, 46)");
  await expect(primary).toHaveCSS("background-color", "rgb(255, 255, 255)");
  for (const control of [primary, secondary, archive]) {
    const before = await control.boundingBox();
    const normalBackground = await control.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(before).not.toBeNull();
    const radius = await control.evaluate((el) =>
      Number.parseFloat(getComputedStyle(el).borderTopLeftRadius),
    );
    expect(radius).toBeGreaterThanOrEqual(before!.height / 2);
    await control.hover();
    await expect(control).not.toHaveCSS("background-color", normalBackground);
    await expect(control).toHaveCSS(
      "color",
      control === secondary ? "rgb(255, 255, 255)" : "rgb(11, 31, 58)",
    );
    await expect(control).toHaveCSS("scale", "none");
    await expect(control).toHaveCSS("translate", "0px -2px");
    const hovered = await control.boundingBox();
    expect(hovered!.width).toBeCloseTo(before!.width, 1);
    expect(hovered!.y).toBeCloseTo(before!.y - 2, 1);
    await page.mouse.down();
    await expect(control).toHaveCSS("scale", "0.96");
    // Release outside the link to avoid navigating during this state check.
    await page.mouse.move(0, 0);
    await page.mouse.up();
    await expect(control).toHaveCSS("scale", "none");
  }
  await page.keyboard.press("Tab");
  await primary.focus();
  await expect(primary).toHaveCSS("outline-style", "solid");
  await expect(primary).toHaveCSS("scale", "none");
});

test("reduced motion removes non-essential button and gallery motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const primary = page.locator("main").getByRole("link", {
    name: "Calendario de Próximos Eventos",
    exact: true,
  });
  await expect(primary).toHaveCSS("transition-duration", "0s");
  await primary.hover();
  await page.mouse.down();
  await expect(primary).toHaveCSS("scale", "1");
  await page.mouse.move(0, 0);
  await page.mouse.up();

  await page.goto("/galeria/");
  await page.locator(".gallery-featured-frame").hover();

  const featuredImage = page.locator(".gallery-featured-image");
  await expect(featuredImage).toHaveCSS("transform", "none");

  const previous = page.getByRole("button", {
    name: "Imagen anterior",
  });
  await expect(previous).toHaveCSS("transition-duration", "0s");
});

test("shared navigation arrows preserve visual interaction states", async ({
  page,
}) => {
  await page.clock.setFixedTime(FIXED_TEST_TIME);
  await page.goto("/galeria/");

  const nextArrow = page.getByRole("button", {
    name: "Imagen siguiente",
  });

  const readColors = () =>
    nextArrow.evaluate((element) => {
      const styles = getComputedStyle(element);

      return {
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        color: styles.color,
      };
    });

  const normalColors = await readColors();

  await nextArrow.hover();
  await page.waitForTimeout(250);

  const hoverColors = await readColors();
  expect(hoverColors).not.toEqual(normalColors);

  await nextArrow.click();
  await page.waitForTimeout(50);
  expect(await readColors()).toEqual(hoverColors);

  await page.locator(".gallery-featured-frame > button").click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS("scale", "none");

  const lightboxNext = dialog.getByRole("button", {
    name: "Imagen siguiente",
  });

  const initialBox = await lightboxNext.boundingBox();
  expect(initialBox).not.toBeNull();

  await lightboxNext.hover();
  await expect
    .poll(async () => {
      const box = await lightboxNext.boundingBox();
      return box ? box.y + box.height / 2 : null;
    })
    .toBeCloseTo(initialBox!.y + initialBox!.height / 2, 1);

  await lightboxNext.dispatchEvent("pointerdown", {
    pointerId: 1,
    pointerType: "mouse",
    button: 0,
  });

  await expect
    .poll(async () => {
      const box = await lightboxNext.boundingBox();
      return box ? box.y + box.height / 2 : null;
    })
    .toBeCloseTo(initialBox!.y + initialBox!.height / 2, 1);

  await page.goto("/eventos/");

  const disabledArrow = page
    .getByRole("button", {
      name: "Ver los dos meses anteriores",
    })
    .first();

  await expect(disabledArrow).toBeDisabled();
  await expect(disabledArrow).toHaveCSS("opacity", "0.35");
  await expect(disabledArrow).toHaveCSS("transition-duration", "0s");
  await expect(disabledArrow).toHaveCSS("scale", "1");

  const spanishCalendar = page.getByRole("button", {
    name: "Calendario",
  });
  await expect(spanishCalendar).toHaveClass(/border-site-accent/);
});

test("icon controls grow around their center and filters preserve selection", async ({
  page,
}) => {
  await page.clock.setFixedTime(FIXED_TEST_TIME);
  await page.goto("/galeria/");
  await page.waitForLoadState("networkidle");
  const next = page.getByRole("button", {
    name: "Imagen siguiente",
    exact: true,
  });
  await expect(next).toBeEnabled();
  const before = await next.boundingBox();
  await next.hover();
  await expect(next).toHaveCSS("translate", "none");
  await expect(next).toHaveCSS("scale", "1.08");
  await expect(next.locator("svg")).toHaveCSS("translate", "3px");
  const hovered = await next.boundingBox();
  expect(hovered!.y + hovered!.height / 2).toBeCloseTo(
    before!.y + before!.height / 2,
    1,
  );
  await page.mouse.down();
  await expect(next).toHaveCSS("scale", "0.92");
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await page.goto("/eventos/pasados/");
  await page.waitForLoadState("networkidle");
  const filter = page.getByRole("combobox", { name: "Tipo", exact: true });
  await filter.selectOption("seminario");
  const label = filter.locator("..").locator("span[aria-hidden=true]");
  await expect(label).toHaveCSS("background-color", "rgb(22, 58, 99)");
  const selectedColor = await label.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  await filter.hover();
  await expect(label).toHaveCSS("background-color", selectedColor);
  await expect(filter).toHaveValue("seminario");
});

test("selection, disclosure and image controls use finite functional feedback", async ({
  page,
}) => {
  await page.goto("/eventos/pasados/");
  await page.waitForLoadState("networkidle");
  const filter = page.getByRole("combobox", { name: "Tipo", exact: true });
  await filter.selectOption("seminario");
  const selection = filter.locator("..").locator("[data-selected=true]");
  await expect(selection).toHaveCSS(
    "animation-name",
    "control-selection-confirm",
  );
  await expect(selection).toHaveCSS("animation-iteration-count", "1");
  await page.goto("/galeria/");
  await page.waitForLoadState("networkidle");
  await page.locator(".gallery-featured-frame > button").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS("animation-name", "control-dialog-appear");
  const close = dialog.getByRole("button", { name: "Cerrar galería" });
  await close.hover();
  await expect(close.locator("svg")).toHaveCSS("rotate", "90deg");
  await close.click();
  await expect(dialog).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await expect(page.locator("#mobile-menu")).toHaveCSS(
    "animation-name",
    "control-panel-appear",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("#mobile-menu")).toBeHidden();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await expect(page.locator("#mobile-menu")).toHaveCSS(
    "animation-name",
    "none",
  );
});

test("secondary event actions invert background, text and icons on hover", async ({
  page,
}) => {
  for (const route of ["/", "/eventos/"]) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const location = page.locator("main a[aria-label*='ubicación']").first();
    await location.hover();
    await expect(location).toHaveCSS("background-color", "rgb(22, 58, 99)");
    await expect(location).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(location.locator("svg")).toHaveCSS(
      "color",
      "rgb(255, 255, 255)",
    );
  }
  const navigation = page
    .locator("main .control-navigation:not([aria-current])")
    .first();
  await navigation.hover();
  await expect(navigation).toHaveCSS("background-color", "rgb(22, 58, 99)");
  await expect(navigation).toHaveCSS("color", "rgb(255, 255, 255)");
  const path = await page
    .locator("main a[aria-label*='detalles' i]")
    .first()
    .getAttribute("href");
  expect(path).toBeTruthy();
  await page.goto(path!);
  await page.waitForLoadState("networkidle");
  const back = page.getByRole("link", {
    name: "Volver al calendario",
    exact: true,
  });
  await back.hover();
  await expect(back).toHaveCSS("background-color", "rgb(22, 58, 99)");
  await expect(back).toHaveCSS("color", "rgb(255, 255, 255)");
});

type ContentMotionRecord = {
  id: string;
  frames: Keyframe[];
  duration: number;
  insideMain: boolean;
};

test.describe("page transitions follow navigation intent", () => {
  test.use({ viewport: { width: 1366, height: 768 } });
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const records: ContentMotionRecord[] = [];
      Object.assign(window, { contentMotionRecords: records });
      const original = Element.prototype.animate;
      Element.prototype.animate = function (frames, options) {
        if (typeof options === "object" && options.id?.startsWith("content-")) {
          records.push({
            id: options.id,
            frames: Array.isArray(frames) ? frames : [],
            duration: Number(options.duration),
            insideMain: Boolean(this.closest("main")),
          });
        }
        return original.call(this, frames, options);
      };
    });
  });

  const records = (page: import("@playwright/test").Page) =>
    page.evaluate(
      () =>
        (window as unknown as { contentMotionRecords: ContentMotionRecord[] })
          .contentMotionRecords,
    );

  test("sections and event details enter in their intended direction without animating the shell", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect.poll(() => records(page)).toEqual([]);
    await page
      .locator("main")
      .getByRole("link", {
        name: "Calendario de Próximos Eventos",
        exact: true,
      })
      .click();
    await expect
      .poll(async () => (await records(page)).at(-1)?.id)
      .toBe("content-section");
    expect((await records(page)).at(-1)?.frames[0].transform).toBe(
      "translateY(12px)",
    );
    await page.locator("main a[aria-label*='detalles' i]").first().click();
    await expect
      .poll(async () => (await records(page)).at(-1)?.id)
      .toBe("content-event");
    expect((await records(page)).at(-1)?.frames[0].transform).toBe(
      "translateX(16px)",
    );
    await page
      .getByRole("link", { name: "Volver al calendario", exact: true })
      .click();
    await expect
      .poll(async () => (await records(page)).at(-1)?.id)
      .toBe("content-back");
    expect((await records(page)).at(-1)?.frames[0].transform).toBe(
      "translateX(-16px)",
    );
    expect((await records(page)).every((record) => record.insideMain)).toBe(
      true,
    );
    expect(
      (await records(page)).every((record) => record.duration === 280),
    ).toBe(true);
  });

  test("months, archive pages and filters use directional movement or a fade", async ({
    page,
  }) => {
    await page.goto("/eventos/");
    await page.waitForLoadState("networkidle");
    await page
      .getByRole("button", {
        name: "Ver los dos meses siguientes",
        exact: true,
      })
      .click();
    await expect
      .poll(async () => (await records(page)).at(-1)?.id)
      .toBe("content-next");
    expect((await records(page)).at(-1)?.duration).toBe(220);
    await page
      .getByRole("button", {
        name: "Ver los dos meses anteriores",
        exact: true,
      })
      .click();
    await expect
      .poll(async () => (await records(page)).at(-1)?.id)
      .toBe("content-previous");
    await page.goto("/eventos/pasados/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Siguiente", exact: true }).click();
    await expect
      .poll(async () => (await records(page)).at(-1)?.id)
      .toBe("content-next");
    await page
      .getByRole("combobox", { name: "Tipo", exact: true })
      .selectOption("seminario");
    await expect
      .poll(async () => (await records(page)).at(-1)?.id)
      .toBe("content-fade");
    expect((await records(page)).at(-1)?.duration).toBe(180);
    expect((await records(page)).at(-1)?.frames[0].transform).toBe("none");
  });

  test("language changes fade, and reduced motion suppresses route and month movement", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: /^EN:/ }).click();
    await expect
      .poll(async () => (await records(page)).at(-1)?.id)
      .toBe("content-fade");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page
      .locator("main")
      .getByRole("link", {
        name: "Calendario de Próximos Eventos",
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(/\/eventos\/$/);
    await page
      .getByRole("button", {
        name: "Ver los dos meses siguientes",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Ver los dos meses anteriores",
        exact: true,
      }),
    ).toBeEnabled();
    expect(await records(page)).toEqual([]);
  });
});
