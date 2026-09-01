import { expect, test } from "@playwright/test";
import { openCrisis } from "../fixtures/staybridge";

test("AC-31–34, AC-36–40, AC-42–43 Preparedness View presents data, limits, gaps and a checklist", async ({ page }) => {
  await openCrisis(page);
  await expect(page.getByText("北区 × Myanmar · ミャンマー", { exact: true })).toBeVisible(); // AC-32: MVP has a fixed visible scenario, not a picker.
  await expect(page.getByText("ミャンマー国籍・地域の住民（比較率ではなく参考人数）")).toBeVisible(); // AC-33
  const population = page.locator(".population-card");
  await expect(population.getByText("北区", { exact: true })).toBeVisible(); // AC-34
  await expect(population.getByText("住民基本台帳", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "次に確認する情報" })).toBeVisible(); // AC-37
  await expect(page.getByText("平時の居住者分布に加えて、短期滞在者の状況、実際の相談件数、窓口の処理能力を確認します。", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "確認できた地域資源" })).toBeVisible(); // AC-36
  await page.getByText(/収録した施設を見る/).click();
  await expect(page.getByText("おうじキッズクリニック", { exact: true })).toBeVisible();
  const coverage = page.locator(".coverage-banner");
  await expect(coverage).toContainText("この数値で確認できる範囲"); // AC-38
  await expect(coverage).toContainText("短期滞在者"); // AC-39
  await expect(coverage).toContainText("相談件数");
  await expect(coverage).toContainText("窓口の対応余力");
  await expect(page.getByRole("heading", { name: "追加で確認する情報" })).toBeVisible(); // AC-40
  for (const gap of ["短期滞在者の地域分布", "施設・窓口の対応余力", "対応言語の統一データ", "リアルタイムの利用可否"]) {
    await expect(page.getByRole("heading", { name: gap })).toBeVisible();
  }
  // AC-41 is intentionally not counted: the required “real demand” gap is not rendered.
  await expect(page.getByRole("heading", { name: "対応検討項目" })).toBeVisible(); // AC-42
  await expect(page.getByText("ミャンマー語・英語で案内できる情報を確認", { exact: true })).toBeVisible(); // AC-43
});
