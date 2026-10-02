import type { Page } from "@playwright/test";

export async function getReachability(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const main = document.querySelector("main");
    const appShell = document.querySelector("#root > div");
    const contentElements = Array.from(
      main?.querySelectorAll<HTMLElement>(
        'h1, h2, h3, p, a[href], button:not([disabled]), dt, dd, time, img:not([aria-hidden="true"])',
      ) ?? [],
    ).filter((element) => element.getClientRects().length > 0);

    const clippedContent = contentElements.flatMap((element) => {
      const elementRect = element.getBoundingClientRect();
      let ancestor = element.parentElement;
      let reachableLeft = elementRect.left;
      let reachableRight = elementRect.right;

      while (ancestor && ancestor !== document.body) {
        const styles = getComputedStyle(ancestor);
        if (
          ["auto", "scroll"].includes(styles.overflowX) &&
          ancestor.scrollWidth > ancestor.clientWidth + 1
        ) {
          // Offscreen carousel items can be brought into this scrollport.
          // Its outer ancestors must still contain the scrollport itself.
          const scrollport = ancestor.getBoundingClientRect();
          reachableLeft = Math.max(reachableLeft, scrollport.left);
          reachableRight = Math.min(reachableRight, scrollport.right);
          if (reachableLeft > reachableRight) {
            reachableLeft = scrollport.left;
            reachableRight = scrollport.right;
          }
        }
        const clipsX = ["hidden", "clip"].includes(styles.overflowX);
        const clipsY = ["hidden", "clip"].includes(styles.overflowY);
        if (clipsX || clipsY) {
          const ancestorRect = ancestor.getBoundingClientRect();
          const outsideX =
            reachableLeft < ancestorRect.left - 1 ||
            reachableRight > ancestorRect.right + 1;
          const outsideY =
            elementRect.top < ancestorRect.top - 1 ||
            elementRect.bottom > ancestorRect.bottom + 1;
          if ((clipsX && outsideX) || (clipsY && outsideY)) {
            return [
              {
                label:
                  element.getAttribute("aria-label")?.trim() ||
                  element.getAttribute("alt")?.trim() ||
                  element.textContent?.trim().slice(0, 80) ||
                  element.outerHTML.slice(0, 80),
                tag: element.tagName.toLowerCase(),
                clippedBy: ancestor.tagName.toLowerCase(),
              },
            ];
          }
        }
        ancestor = ancestor.parentElement;
      }

      return [];
    });

    const internalVerticalScrollOwners = Array.from(
      main?.querySelectorAll<HTMLElement>("*") ?? [],
    )
      .filter((element) => {
        const overflowY = getComputedStyle(element).overflowY;
        return (
          (overflowY === "auto" || overflowY === "scroll") &&
          element.scrollHeight > element.clientHeight + 1
        );
      })
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: element.className,
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
      }));

    return {
      documentOwnsVerticalOverflow: root.scrollHeight > root.clientHeight + 1,
      flowLockOwners: [root, document.body, appShell, main]
        .filter((element): element is Element => element !== null)
        .filter((element) => {
          const overflowY = getComputedStyle(element).overflowY;
          return overflowY === "hidden" || overflowY === "clip";
        })
        .map((element) => element.tagName.toLowerCase()),
      hasHorizontalOverflow: root.scrollWidth > root.clientWidth + 1,
      clippedContent,
      internalVerticalScrollOwners,
    };
  });
}
