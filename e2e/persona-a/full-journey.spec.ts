import { expect, test } from "@playwright/test";
import { createEvidence } from "../../helpers/evidence";
import { openHome, roadmapCard } from "../../fixtures/staybridge";
import { USER_URL } from "../../helpers/targets";

test("Persona A full journey @evidence", async ({ page, context }, testInfo) => {
  const evidence = createEvidence(page, testInfo);
  try {
    await evidence.navigate(USER_URL, { step: 1, total: 11, action: "START", detail: "Persona AとしてStayBridgeを開始", verify: "Landingが表示される" });
    // Wait for the app's public startup/hydration work before changing UI state.
    await page.waitForLoadState("networkidle");
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(page.url()).origin });
    await expect(page.getByRole("heading", { name: /国には帰れない/ })).toBeVisible();
    await evidence.pass("Landingを確認");
    await evidence.capture({ scenario: "persona-a", name: "01-landing", acceptance: ["AC-01"] });

    await evidence.step({ step: 2, total: 11, action: "CLICK", detail: "「デモの状況を読み込む」", acceptance: ["AC-02"] });
    await evidence.click(page.getByRole("button", { name: "デモの状況を読み込む" }));
    await expect(page.getByRole("heading", { name: "今の状況を整理しました" })).toBeVisible();
    await evidence.pass("Persona Aのデモ状況を読み込みました");
    await evidence.capture({ scenario: "persona-a", name: "02-situation", acceptance: ["AC-02"] });

    await evidence.step({ step: 3, total: 11, action: "CLICK", detail: "「次のステップを見る」", acceptance: ["AC-08", "AC-13"], verify: "Situationから優先順位付きRoadmapが生成される" });
    await evidence.click(page.getByRole("button", { name: "次のステップを見る" }));
    await expect(page.getByRole("heading", { name: "あなたの次のステップ" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "TODAY · 今日" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "THIS WEEK · 今週" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "NEXT 30 DAYS · 当面" })).toBeVisible();
    const stay = await roadmapCard(page, "日本に滞在できる期間を確認する");
    await expect(stay).toContainText("公式窓口");
    await expect(stay.getByRole("link").first()).toHaveAttribute("href", /^https?:\/\//);
    const education = await roadmapCard(page, "子どもの教育について相談する");
    await expect(education).toBeVisible();
    const employment = await roadmapCard(page, "働ける条件を先に確認する");
    await expect(employment).toContainText("仕事を探す前に");
    await expect(employment).not.toContainText("働けます");
    await expect(page.locator("main")).not.toContainText("あなたは難民です");
    await expect(page.locator("main")).not.toContainText(/難民認定.*確率/);
    await expect(page.locator("main")).not.toContainText(/ミャンマー.*危険度/);
    await evidence.pass("Roadmapの優先区分を確認");
    await evidence.capture({ scenario: "persona-a", name: "03-roadmap", acceptance: ["AC-08", "AC-09", "AC-10", "AC-12", "AC-13", "AC-16", "SAFE-02", "SAFE-03", "SAFE-06"] });
    await evidence.capture({ scenario: "persona-a", name: "03b-employment-safety", acceptance: ["AC-12", "SAFE-04"] });

    await evidence.step({ step: 4, total: 11, action: "VERIFY", detail: "滞在Action", acceptance: ["AC-09"], verify: "まず滞在状況の公式確認を案内" });
    await expect(stay).not.toContainText("日本に滞在できます");
    await evidence.pass("滞在状況の公式確認を案内");
    await evidence.capture({ scenario: "persona-a", name: "03a-stay-safety", acceptance: ["SAFE-01"] });

    await evidence.step({ step: 5, total: 11, action: "CLICK", detail: "「なぜこの案内？」", acceptance: ["AC-14", "AC-15"], verify: "本人の入力状況を理由として説明" });
    await evidence.click(education.getByText("なぜこの案内？"));
    await expect(education).toContainText("学齢期の子ども");
    await evidence.pass("教育Actionの理由を確認");
    await evidence.capture({ scenario: "persona-a", name: "04-why", acceptance: ["AC-14", "AC-15"] });

    await evidence.step({ step: 6, total: 11, action: "VERIFY", detail: "教育Action", acceptance: ["AC-10"], verify: "6歳の子どもがいるため教育Actionを表示" });
    await expect(education).toBeVisible();
    await evidence.pass("教育Actionを確認");

    await evidence.step({ step: 7, total: 11, action: "CLICK", detail: "近くの学校を見る", acceptance: ["AC-17", "AC-18"], verify: "学校情報が表示される" });
    await evidence.click(education.getByRole("button", { name: "近くの学校を見る" }));
    await evidence.logicalNavigation("roadmap", "local");
    await expect(page.getByRole("heading", { name: "この地域で確認できる場所" })).toBeVisible();
    await page.getByRole("tab", { name: "学校・教育" }).click();
    await expect(page.getByRole("heading", { name: "豊川小学校" })).toBeVisible();
    await evidence.pass("学校情報を確認");

    await evidence.step({ step: 8, total: 11, action: "VERIFY", detail: "Open Data Source", acceptance: ["AC-20", "AC-21"], verify: "学校情報に公開データの出典がある" });
    const school = page.locator(".resource-card").filter({ has: page.getByRole("heading", { name: "豊川小学校" }) });
    await expect(school).toContainText("Open Data source");
    await expect(school.getByRole("link", { name: /Kita City Board of Education/ })).toHaveAttribute("href", /^https?:\/\//);
    await expect(school).toContainText("入学・就学については自治体または教育機関への確認が必要です。");
    await expect(school).not.toContainText("入学できます");
    await evidence.pass("学校のデータ出典を確認");
    await evidence.capture({ scenario: "persona-a", name: "05-local-schools", acceptance: ["AC-17", "AC-18", "AC-20", "AC-21", "AC-22", "SAFE-05"] });

    await evidence.step({ step: 9, total: 11, action: "CLICK", detail: "医療", acceptance: ["AC-19"], verify: "地域の医療機関を確認" });
    await evidence.click(page.getByRole("tab", { name: "医療" }));
    await expect(page.getByRole("heading", { name: "おうじキッズクリニック" })).toBeVisible();
    const medical = page.locator(".resource-card").filter({ has: page.getByRole("heading", { name: "おうじキッズクリニック" }) });
    await expect(medical).toContainText("Confirm services and appointment requirements directly.");
    await expect(medical).not.toContainText("利用できます");
    await evidence.pass("医療機関を確認");
    await evidence.capture({ scenario: "persona-a", name: "06-local-medical", acceptance: ["AC-19", "AC-23"] });

    await evidence.step({ step: 10, total: 11, action: "CLICK", detail: "相談先", acceptance: ["AC-24", "AC-25", "AC-26"], verify: "個別判断を公的相談窓口へ引き継ぐ" });
    // Return using the user-visible primary navigation; this preserves the completed
    // public assessment and avoids the visually-overlapped brand mark on narrow viewports.
    await page.getByRole("navigation", { name: "Primary" }).getByRole("button", { name: "わたしのステップ" }).click();
    await expect(page.getByRole("heading", { name: "あなたの次のステップ" })).toBeVisible();
    const renewedStay = await roadmapCard(page, "日本に滞在できる期間を確認する");
    await renewedStay.getByRole("button", { name: "公式相談先を見る" }).click();
    await evidence.logicalNavigation("roadmap", "help");
    await expect(page.getByRole("heading", { name: "人に相談する" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Foreign Residents Support Center (FRESC) contacts" })).toBeVisible();
    await evidence.pass("人による公式相談窓口を確認");
    await evidence.capture({ scenario: "persona-a", name: "07-human-support", acceptance: ["AC-24", "AC-25", "AC-26"] });

    await evidence.step({ step: 11, total: 11, action: "CLICK", detail: "相談内容をまとめる", acceptance: ["AC-27", "AC-28", "AC-29", "AC-30"], verify: "入力した事実だけで相談内容を整理" });
    await evidence.click(page.getByRole("button", { name: "相談内容をまとめる" }));
    await evidence.logicalNavigation("help", "summary");
    const summary = page.locator(".summary-sheet");
    await expect(summary).toContainText("地域: 北区");
    await expect(summary).toContainText("帰国することが難しい");
    await expect(summary).toContainText("子どもがいる · 年齢: 6-11");
    await expect(summary).not.toContainText(/政治|迫害|難民/);
    await evidence.click(page.getByRole("button", { name: "コピーする" }));
    await expect(page.getByRole("button", { name: /コピーしました/ })).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    await expect(copied).toContain("相談員に見せるサマリー");
    await expect(copied).toContain("地域: 北区");
    await evidence.pass("相談サマリーを確認");
    await evidence.capture({ scenario: "persona-a", name: "08-consultation-summary", acceptance: ["AC-27", "AC-28", "AC-29", "AC-30"] });
  } catch (error) {
    await evidence.fail("Persona A journey assertion failed", error);
    throw error;
  } finally {
    await evidence.finalize({ scenario: "persona-a", videoName: "persona-a" });
  }
});
