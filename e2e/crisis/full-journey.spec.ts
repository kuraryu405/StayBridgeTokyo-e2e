import { expect, test } from "@playwright/test";
import { createEvidence } from "../../helpers/evidence";

test("Crisis Preparedness full journey @evidence", async ({ page }, testInfo) => {
  const evidence = createEvidence(page, testInfo);
  try {
    await evidence.navigate("/crisis", { step: 1, total: 8, action: "START", detail: "Preparedness Viewを開く", acceptance: ["AC-31"], verify: "行政向け画面が表示される" });
    await expect(page.getByText("Preparedness View", { exact: true })).toBeVisible();
    await evidence.pass("Preparedness Viewを確認");

    await evidence.step({ step: 2, total: 8, action: "VERIFY", detail: "Myanmarケース", acceptance: ["AC-32"], verify: "対象国籍・地域がMyanmarである" });
    await expect(page.getByText("北区 × Myanmar · ミャンマー", { exact: true })).toBeVisible();
    await expect(page.locator("footer.crisis-footer")).toContainText("個人追跡・住所レベル表示・法的判断を行いません");
    await expect(page.locator("main")).not.toContainText(/緯度|経度|GPS/);
    await evidence.pass("Myanmarケースを確認");
    await evidence.capture({ scenario: "crisis", name: "01-crisis-overview", acceptance: ["AC-31", "AC-32", "SAFE-07"] });

    await evidence.step({ step: 3, total: 8, action: "VERIFY", detail: "Population", acceptance: ["AC-33", "AC-34"], verify: "外国人人口を自治体別に表示" });
    await expect(page.getByText("北区 · KITA CITY", { exact: true })).toBeVisible();
    await expect(page.getByText("ミャンマー国籍・地域の住民（比較率ではなく参考人数）")).toBeVisible();
    await evidence.pass("北区の人口データを確認");
    await evidence.capture({ scenario: "crisis", name: "02-municipality", acceptance: ["AC-33", "AC-34"] });

    await evidence.step({ step: 4, total: 8, action: "KNOWN GAP", detail: "Municipality drill-down", verify: "北区の固定MVP詳細のみで、自治体詳細への操作導線はない" });
    await expect(page.getByText("北区 · KITA CITY", { exact: true })).toBeVisible();

    await evidence.step({ step: 5, total: 8, action: "CLICK", detail: "収録した施設を見る", acceptance: ["AC-36", "AC-37"], verify: "地域資源と非断定の説明を確認" });
    await evidence.click(page.locator("details.dataset-details summary"));
    await expect(page.getByText("豊川小学校", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "「支援が不足」とは断定できません" })).toBeVisible();
    await evidence.pass("地域資源と解釈上の注意を確認");
    await evidence.capture({ scenario: "crisis", name: "03-resources", acceptance: ["AC-36", "AC-37"] });

    await evidence.step({ step: 6, total: 8, action: "VERIFY", detail: "Coverage Note", acceptance: ["AC-38", "AC-39"], verify: "短期滞在者は人口統計だけでは完全に把握できない" });
    await expect(page.locator(".coverage-banner")).toContainText("短期滞在中の旅行者等を完全には表しません");
    await evidence.pass("Coverage Noteを確認");
    await evidence.capture({ scenario: "crisis", name: "04-coverage-note", acceptance: ["AC-38", "AC-39"] });

    await evidence.step({ step: 7, total: 8, action: "VERIFY", detail: "Data Gap", acceptance: ["AC-40"], verify: "Open Dataで分からないことを表示" });
    await expect(page.getByRole("heading", { name: "今のOpen Dataでは分からないこと" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "短期滞在者の地域分布" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "対応言語の統一データ" })).toBeVisible();
    await evidence.pass("Data Gapを確認（AC-41のreal demand項目は現実装に不存在）");
    await evidence.capture({ scenario: "crisis", name: "05-data-gap", acceptance: ["AC-40"] });

    await evidence.step({ step: 8, total: 8, action: "VERIFY", detail: "Preparation Checklist", acceptance: ["AC-42", "AC-43"], verify: "人口可視化で終わらず対応検討項目を表示" });
    await expect(page.getByRole("heading", { name: "対応検討項目" })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "ミャンマー語・英語で案内できる情報を確認" })).toBeVisible();
    await evidence.pass("Preparation Checklistを確認");
    await evidence.capture({ scenario: "crisis", name: "06-preparation-checklist", acceptance: ["AC-42", "AC-43"] });
  } catch (error) {
    await evidence.fail("Crisis journey assertion failed", error);
    throw error;
  } finally {
    await evidence.finalize({ scenario: "crisis", videoName: "crisis" });
  }
});
