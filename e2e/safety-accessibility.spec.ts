import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { demoRoadmap, loadDemo, openCrisis, openHome, roadmapCard } from "../fixtures/staybridge";

test("SAFE-01/02/03/05/06 service makes no unsafe legal, refugee, school, or nationality-risk claim", async ({ page }) => {
  await openHome(page);
  await expect(page.locator("main")).not.toContainText("あなたは難民です");
  await expect(page.locator("main")).not.toContainText(/難民認定.*確率/);
  await expect(page.locator("main")).not.toContainText(/ミャンマー.*危険度/);
  await loadDemo(page);
  await expect(page.getByText(/在留手続や法律上の判断は、専門相談窓口で確認してください/)).toBeVisible();
  await page.getByRole("button", { name: "次のステップを見る" }).click();
  const childSupport = await roadmapCard(page, "子どもと利用できる地域資源を確認する");
  await childSupport.getByRole("button", { name: "子どもの居場所を見る" }).click();
  await expect(page.locator("main")).not.toContainText("入学できます");
});

test("SAFE-07 crisis view does not expose individual tracking or address-level location", async ({ page }) => {
  await openCrisis(page);
  await expect(page.getByText(/会話本文・個票は含まれません/)).toBeVisible();
  await expect(page.getByText("公開情報と匿名集計を使用", { exact: true })).toBeVisible();
  await expect(page.locator(".crisis-main")).not.toContainText(/緯度|経度|GPS/);
});

for (const target of ["landing", "situation", "roadmap", "local", "crisis"] as const) {
  test(`a11y ${target}: no serious or critical axe violations`, async ({ page }) => {
    if (target === "landing") await openHome(page);
    if (target === "situation") { await openHome(page); await page.getByRole("button", { name: "今の状況を確認する" }).click(); }
    if (target === "roadmap" || target === "local") {
      await demoRoadmap(page);
      if (target === "local") await page.getByRole("button", { name: "近くの支援", exact: true }).click();
    }
    if (target === "crisis") await openCrisis(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((v) => ["critical", "serious"].includes(v.impact || ""))).toEqual([]);
  });
}

test("keyboard: landing CTA and Situation Check next button work with Enter", async ({ page }) => {
  await openHome(page);
  await page.getByRole("button", { name: "今の状況を確認する" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "今、東京のどの地域に滞在していますか？" })).toBeVisible();
  await page.getByRole("radio", { name: "北区" }).focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "次へ" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "国籍・地域を教えてください。" })).toBeVisible();
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  test("Persona UI has no horizontal document overflow", async ({ page }) => {
    await openHome(page);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole("button", { name: "デモの状況を読み込む" }).click();
    await page.getByRole("button", { name: "次のステップを見る" }).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
