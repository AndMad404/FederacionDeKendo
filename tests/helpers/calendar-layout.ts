import { expect, type Page, type TestInfo } from "@playwright/test";
import { measureCalendarBlocks } from "./calendar-block-measurements";
import { getReachability } from "./content-reachability";

export interface LayoutFinding {
  event?: string;
  rule: string;
  component: string;
  measures: Record<string, unknown>;
}

export async function settleCalendarLayout(page: Page) {
  await expect(page.locator("main")).toBeAttached();
  // The button installs a React event handler after hydration, so focus and
  // DOM replacement must finish before measuring the generated SSR surface.
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const image of document.querySelectorAll<HTMLImageElement>(
      "main img",
    )) {
      image.loading = "eager";
      await image.decode().catch(() => undefined);
    }
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
}

export async function calendarLayoutFindings(
  page: Page,
  expectedPhotos = 0,
): Promise<LayoutFinding[]> {
  const reachability = await getReachability(page, true);
  const findings: LayoutFinding[] = [];
  if (reachability.hasHorizontalOverflow)
    findings.push({
      rule: "overflow_horizontal",
      component: "document",
      measures: await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      })),
    });
  for (const clipped of reachability.clippedContent)
    findings.push({
      rule: "recorte",
      component: clipped.label,
      measures: clipped,
      event: clipped.ownerEvent,
    });
  return findings.concat(
    await page.evaluate((expectedPhotos) => {
      const results: LayoutFinding[] = [];
      const box = (element: Element) => element.getBoundingClientRect();
      const visible = (element: Element) =>
        element.getClientRects().length > 0 &&
        getComputedStyle(element).visibility !== "hidden";
      const record = (
        rule: string,
        component: string,
        measures: Record<string, unknown>,
        element?: Element,
      ) => {
        const card = element?.closest("li");
        const href = card?.querySelector<HTMLAnchorElement>(
          'a[href^="/eventos/"], a[href^="/en/events/"]',
        )?.pathname;
        results.push({
          rule,
          component: element
            ? `${component}: ${element.getAttribute("aria-label") ?? element.textContent?.trim().slice(0, 80) ?? ""}`
            : component,
          measures,
          ...(href ? { event: href.split("/").filter(Boolean).at(-1) } : {}),
        });
      };
      const event = Boolean(
        document.querySelector('[aria-labelledby="event-page-title"]'),
      );
      const required = event
        ? ["main h1", "main article", "main dl", "main article aside", "footer"]
        : ["main h1", "main", "footer", "main nav"];
      for (const selector of required) {
        const element = document.querySelector(selector);
        if (!element) record("componente_ausente", selector, { count: 0 });
        else if (
          !visible(element) ||
          box(element).height < 1 ||
          box(element).width < 1
        )
          record("colapso", selector, {
            width: box(element).width,
            height: box(element).height,
          });
      }
      const main = document.querySelector("main")!;
      for (const element of main.querySelectorAll<HTMLElement>(
        "h1, h2, h3, p, li, dt, dd, a, button, select",
      )) {
        if (
          !visible(element) ||
          element.closest('.sr-only, .line-clamp-2, .max-h-10, [role="group"]')
        )
          continue;
        const rect = box(element);
        const style = getComputedStyle(element);
        if (rect.width < 1 || rect.height < 1)
          record(
            "colapso",
            element.tagName,
            {
              width: rect.width,
              height: rect.height,
            },
            element,
          );
        // scrollWidth also detects glyphs cut off inside a nowrap control.
        if (
          element.scrollWidth > element.clientWidth + 1 &&
          ["hidden", "clip"].includes(style.overflowX)
        )
          record(
            "recorte",
            element.tagName,
            {
              scrollWidth: element.scrollWidth,
              clientWidth: element.clientWidth,
            },
            element,
          );
        if (
          element.scrollHeight > element.clientHeight + 1 &&
          ["hidden", "clip"].includes(style.overflowY)
        )
          record(
            "recorte",
            element.tagName,
            {
              scrollHeight: element.scrollHeight,
              clientHeight: element.clientHeight,
            },
            element,
          );
        const container = element.closest(
          "article, [data-page-content-boundary]",
        );
        if (container && element !== container) {
          const boundary = box(container);
          if (rect.left < boundary.left - 1 || rect.right > boundary.right + 1)
            record(
              "fuera_del_contenedor",
              element.tagName,
              {
                left: rect.left,
                right: rect.right,
                containerLeft: boundary.left,
                containerRight: boundary.right,
              },
              element,
            );
        }
      }
      for (const control of main.querySelectorAll(
        "aside a, aside button, nav button",
      )) {
        if (!visible(control)) continue;
        const rect = box(control);
        if (rect.height < 43 || rect.width < 43)
          record(
            "minimo_control",
            control.getAttribute("aria-label") ??
              control.textContent ??
              "control",
            { width: rect.width, height: rect.height, minimum: 44 },
          );
      }
      const gallery = main.querySelector(
        'section[aria-label^="Fotografías del evento"]',
      );
      if (!gallery && expectedPhotos > 0)
        record("componente_ausente", "gallery", { expectedPhotos });
      if (gallery) {
        const thumbnails = gallery.querySelectorAll<HTMLButtonElement>(
          '[role="group"] button',
        );
        if (expectedPhotos > 1 && thumbnails.length !== expectedPhotos)
          record("fotos_inaccesibles", "gallery thumbnails", {
            count: thumbnails.length,
            expected: expectedPhotos,
          });
        for (const thumbnail of thumbnails) {
          const rect = box(thumbnail);
          if (thumbnail.disabled || rect.width < 43 || rect.height < 43)
            record(
              "miniatura_inaccesible",
              thumbnail.getAttribute("aria-label") ?? "thumbnail",
              {
                disabled: thumbnail.disabled,
                width: rect.width,
                height: rect.height,
                minimum: 44,
              },
            );
        }
        if (!gallery.querySelector("figure img"))
          record("componente_ausente", "gallery image", { count: 0 });
        const selectors = ["figure", "figure button"];
        // The approved single-photo variant omits its thumbnail strip.
        if (
          expectedPhotos > 1 ||
          gallery.querySelectorAll("figure button").length > 1
        )
          selectors.push('[role="group"]');
        for (const selector of selectors) {
          const element = gallery.querySelector(selector);
          if (!element || !visible(element))
            record("componente_ausente", `gallery ${selector}`, {
              count: element ? 1 : 0,
            });
          else if (box(element).height < (selector === "figure" ? 170 : 44))
            record("minimo_galeria", selector, {
              height: box(element).height,
              minimum: selector === "figure" ? 170 : 44,
            });
        }
        for (const image of gallery.querySelectorAll<HTMLImageElement>("img")) {
          if (!image.complete || !image.naturalWidth)
            record("foto_inaccesible", image.alt || image.src, {
              complete: image.complete,
              naturalWidth: image.naturalWidth,
            });
        }
      }
      const sections = event
        ? [
            "main h1",
            "main article dl",
            "main article h2",
            "main article aside",
            'main section[aria-label^="Fotografías del evento"]',
            "footer",
          ]
        : ["main h1", "[data-page-content-boundary]", "footer"];
      const components = sections
        .map((selector) => {
          const element = document.querySelector(selector);
          return {
            selector,
            element:
              selector === "main article h2" &&
              element?.parentElement?.tagName === "DIV"
                ? element.parentElement
                : element,
          };
        })
        .filter(
          (item): item is { selector: string; element: Element } =>
            Boolean(item.element) && visible(item.element!),
        );
      // Banner and panel deliberately overlap; only the actual title is compared.
      for (let i = 0; i < components.length; i++)
        for (let j = i + 1; j < components.length; j++) {
          const a = components[i],
            b = components[j];
          const ra = box(a.element),
            rb = box(b.element);
          const width =
            Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const height =
            Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (width > 1 && height > 1)
            record("solapamiento", `${a.selector} / ${b.selector}`, {
              width,
              height,
            });
        }
      return results;
    }, expectedPhotos),
  );
}

export async function recordCalendarLayout(
  page: Page,
  info: TestInfo,
  state: string,
  expectedPhotos = 0,
) {
  await settleCalendarLayout(page);
  const measurements = await measureCalendarBlocks(page, state, expectedPhotos);
  await info.attach("calendar-layout-measurements", {
    body: JSON.stringify(measurements),
    contentType: "application/json",
  });
  const findings = await calendarLayoutFindings(page, expectedPhotos);
  if (findings.length) {
    await info.attach("calendar-layout-findings", {
      body: JSON.stringify({
        route: new URL(page.url()).pathname,
        event: await page.locator("main h1").textContent(),
        viewport: page.viewportSize(),
        state,
        findings,
      }),
      contentType: "application/json",
    });
    await info.attach("calendar-layout-breakage", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  }
  return findings;
}
