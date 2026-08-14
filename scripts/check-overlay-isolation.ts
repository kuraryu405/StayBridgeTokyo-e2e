import { chromium } from "@playwright/test";
import { clearOverlay, installOverlay, OVERLAY_ID, showOverlay } from "../helpers/evidence/overlay";

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 600, height: 400 } });
    await page.setContent("<main><h1>Application heading</h1><p>Application content</p></main>");
    await installOverlay(page);
    await showOverlay(page, {
      kind: "VERIFY",
      action: "VERIFY",
      detail: "OVERLAY-ONLY-COLLISION-SENTINEL",
      acceptance: ["AC-REGRESSION"],
    });

    if ((await page.locator(`#${OVERLAY_ID}`).count()) !== 1) {
      throw new Error("Evidence overlay host was not injected");
    }
    if ((await page.getByText("Application heading", { exact: true }).count()) !== 1) {
      throw new Error("Target application locators stopped working");
    }
    if ((await page.getByText("OVERLAY-ONLY-COLLISION-SENTINEL", { exact: true }).count()) !== 0) {
      throw new Error("Evidence overlay leaked into Playwright text locators");
    }

    const withOverlay = await page.screenshot();
    await clearOverlay(page);
    const withoutOverlay = await page.screenshot();
    if (withOverlay.equals(withoutOverlay)) {
      throw new Error("Closed-root overlay was not visible to screenshot/video capture");
    }

    // addInitScript must recreate the isolated overlay after a real document navigation.
    await page.goto("data:text/html,<main><h1>Second document</h1></main>");
    await showOverlay(page, {
      kind: "NAVIGATION",
      action: "NAVIGATION",
      from: "/first",
      to: "/second",
      detail: "REINJECTION-SENTINEL",
    });
    if ((await page.locator(`#${OVERLAY_ID}`).count()) !== 1) {
      throw new Error("Evidence overlay was not reinjected after navigation");
    }
    if ((await page.getByText("REINJECTION-SENTINEL", { exact: true }).count()) !== 0) {
      throw new Error("Reinjected overlay leaked into Playwright text locators");
    }

    console.log("Overlay isolation, visibility, and reinjection checks passed.");
  } finally {
    await browser.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
