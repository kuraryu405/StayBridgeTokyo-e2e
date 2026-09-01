import { expect, test } from "@playwright/test";
import { openHome } from "../fixtures/staybridge";
import { MUNICIPALITY_URL } from "../helpers/targets";

test("AC-01/02 landing is visible and Situation Check starts", async ({ page }) => {
  await openHome(page);
  await expect(page.getByRole("heading", { name: /見つけよう。\s*東京での第一歩を。/ })).toBeVisible();
  await page.getByRole("button", { name: "今の状況を確認する" }).click();
  await expect(page.getByRole("heading", { name: "東京のどの地域に滞在していますか？" })).toBeVisible();
});

test("landing links to the public Preparedness View", async ({ page }) => {
  await openHome(page);
  await page.getByRole("link", { name: /行政・支援者向けの確認画面/ }).click();
  await expect(page).toHaveURL(new URL(MUNICIPALITY_URL).toString());
  await expect(page.getByText("自治体・支援者向け確認画面", { exact: true })).toBeVisible();
});
