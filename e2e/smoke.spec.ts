import { expect, test } from "@playwright/test";
import { openCrisis, openHome } from "../fixtures/staybridge";

test("AC-01/02 landing is visible and Situation Check starts", async ({ page }) => {
  await openHome(page);
  await expect(page.getByRole("heading", { name: "見つけよう。東京での第一歩を。" })).toBeVisible();
  await page.getByRole("button", { name: "今の状況を確認する" }).click();
  await expect(page.getByRole("heading", { name: "今、東京のどの地域に滞在していますか？" })).toBeVisible();
});

test("landing explains how support teams access the public preparedness view", async ({ page }) => {
  await openHome(page);
  await expect(page.getByRole("heading", { name: "行政・支援者向け" })).toBeVisible();
  await expect(page.getByText("支援チーム: 参考画面は別のURLから確認できます。", { exact: true })).toBeVisible();

  await openCrisis(page);
  await expect(page.getByRole("heading", { name: /支援準備のために、\s*次に確認すること。/ })).toBeVisible();
});
