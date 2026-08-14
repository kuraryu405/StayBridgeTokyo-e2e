import { expect, test } from "@playwright/test";
import { openHome } from "../fixtures/staybridge";

test("AC-01/02 landing is visible and Situation Check starts", async ({ page }) => {
  await openHome(page);
  await expect(page.getByRole("heading", { name: /国には帰れない/ })).toBeVisible();
  await page.getByRole("button", { name: "今の状況を確認する" }).click();
  await expect(page.getByRole("heading", { name: "今、東京のどの地域に滞在していますか？" })).toBeVisible();
});

test("landing links to the public Preparedness View", async ({ page }) => {
  await openHome(page);
  await page.getByRole("link", { name: /Preparedness View/ }).click();
  await expect(page).toHaveURL(/\/crisis$/);
  await expect(page.getByText("Preparedness View", { exact: true })).toBeVisible();
});
