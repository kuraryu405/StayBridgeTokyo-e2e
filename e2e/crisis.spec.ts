import { expect, test } from "@playwright/test";
import { openCrisis } from "../fixtures/staybridge";

test("AC-31–34, AC-36–40, AC-42–43 Preparedness View presents data, limits, gaps and a checklist", async ({ page }) => {
  await openCrisis(page);
  await expect(page.getByText("北区 × Myanmar · ミャンマー", { exact: true })).toBeVisible(); // AC-32: MVP has a fixed visible scenario, not a picker.
  await expect(page.getByText("ミャンマー国籍・地域の住民（比較率ではなく参考人数）")).toBeVisible(); // AC-33
  await expect(page.getByText("北区 · KITA CITY", { exact: true })).toBeVisible(); // AC-34
  await expect(page.getByRole("heading", { name: "確認できた地域資源" })).toBeVisible(); // AC-36
  await page.getByText(/収録した施設を見る/).click();
  await expect(page.getByText("豊川小学校", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "「支援が不足」とは断定できません" })).toBeVisible(); // AC-37
  const coverage = page.locator(".coverage-banner");
  await expect(coverage).toContainText("Data coverage note"); // AC-38
  await expect(coverage).toContainText("短期滞在中の旅行者等を完全には表しません"); // AC-39
  await expect(page.getByRole("heading", { name: "今のOpen Dataでは分からないこと" })).toBeVisible(); // AC-40
  for (const gap of ["短期滞在者の地域分布", "施設・窓口の対応余力", "対応言語の統一データ", "リアルタイムの利用可否"]) {
    await expect(page.getByRole("heading", { name: gap })).toBeVisible();
  }
  // AC-41 is intentionally not counted: the required “real demand” gap is not rendered.
  await expect(page.getByRole("heading", { name: "対応検討項目" })).toBeVisible(); // AC-42
  await expect(page.getByRole("checkbox", { name: "ミャンマー語・英語で案内できる情報を確認" })).toBeVisible();
  await expect(page.getByText("PREPARATION CHECKLIST", { exact: true })).toBeVisible(); // AC-43
});

test("KG-AC35: fixed Kita detail has no user-visible municipality drill-down", async ({ page }) => {
  await openCrisis(page);
  await expect(page.getByText("北区 · KITA CITY", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /北区|KITA/ })).toHaveCount(0);
});
