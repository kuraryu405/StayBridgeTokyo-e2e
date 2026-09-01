import { expect, test } from "@playwright/test";
import { landingPrimaryCta, openHome } from "../fixtures/staybridge";
import { MUNICIPALITY_URL } from "../helpers/targets";

test("AC-01/02 landing is visible and Situation Check starts @release", async ({ page }) => {
  await openHome(page);
  await expect(page.locator("#top").getByRole("heading", { level: 1 })).toBeVisible();
  await landingPrimaryCta(page).click();
  await expect(page).toHaveURL(/\/ja\/check(?:\?step=0)?$/);
  await expect(page.locator(".question-card h1")).toBeVisible();
});

test("landing links to the public Preparedness View @release", async ({ page }) => {
  await openHome(page);
  await page.locator('a[href="/crisis"]').click();
  await expect(page).toHaveURL(new URL(MUNICIPALITY_URL).toString());
  await expect(page.locator("main h1").first()).toBeVisible();
});
