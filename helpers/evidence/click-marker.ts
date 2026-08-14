import type { Locator, Page } from "@playwright/test";

const MARKER_ID = "__staybridge_acceptance_click_marker__";

export async function markClick(page: Page, locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) return;

  await locator.evaluate((element) => {
    const htmlElement = element as HTMLElement;
    const previous = {
      outline: htmlElement.style.outline,
      outlineOffset: htmlElement.style.outlineOffset,
      transition: htmlElement.style.transition,
    };
    htmlElement.style.outline = "3px solid rgba(255, 193, 7, .95)";
    htmlElement.style.outlineOffset = "3px";
    htmlElement.style.transition = "outline-color 160ms ease";
    window.setTimeout(() => {
      htmlElement.style.outline = previous.outline;
      htmlElement.style.outlineOffset = previous.outlineOffset;
      htmlElement.style.transition = previous.transition;
    }, 900);
  });

  await page.evaluate(
    ({ id, x, y }) => {
      document.getElementById(id)?.remove();
      const marker = document.createElement("div");
      marker.id = id;
      marker.setAttribute("aria-hidden", "true");
      Object.assign(marker.style, {
        position: "fixed",
        left: `${x}px`,
        top: `${y}px`,
        width: "18px",
        height: "18px",
        border: "3px solid #ffd166",
        borderRadius: "999px",
        background: "rgba(255, 209, 102, .3)",
        boxShadow: "0 0 0 8px rgba(255, 209, 102, .18)",
        transform: "translate(-50%, -50%) scale(.7)",
        transition: "transform 180ms ease, opacity 600ms ease",
        pointerEvents: "none",
        zIndex: "2147483647",
      });
      document.documentElement.append(marker);
      requestAnimationFrame(() => {
        marker.style.transform = "translate(-50%, -50%) scale(1.25)";
        marker.style.opacity = "0";
      });
      window.setTimeout(() => marker.remove(), 800);
    },
    { id: MARKER_ID, x: box.x + box.width / 2, y: box.y + box.height / 2 },
  );
}
