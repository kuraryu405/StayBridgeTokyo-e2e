import { expect, test } from "@playwright/test";
import { demoRoadmap, goHelp, roadmapCard } from "../fixtures/staybridge";
import { USER_URL } from "../helpers/targets";

test("AC-08–16 Persona A roadmap is prioritized, explained, and source-backed", async ({ page }) => {
  await demoRoadmap(page);
  await expect(page.getByRole("heading", { name: "今日" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "今週" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "今後30日" })).toBeVisible();

  const stay = await roadmapCard(page, "日本に滞在できる期間を確認する");
  await expect(stay).toContainText("出入国在留管理庁または専門相談窓口");
  await expect(stay.getByRole("link").first()).toHaveAttribute("href", /^https?:\/\//);

  const childSupport = await roadmapCard(page, "子どもと利用できる地域資源を確認する");
  await childSupport.getByText("なぜこの案内？").click();
  await expect(childSupport).toContainText("子どもと一緒に東京で生活を続ける可能性");
});

test("AC-17–23 Local Action shows available child and medical facilities with source context", async ({ page }) => {
  await demoRoadmap(page);
  const childSupport = await roadmapCard(page, "子どもと利用できる地域資源を確認する");
  await childSupport.getByRole("button", { name: "子どもの居場所を見る" }).click();
  await expect(page.getByRole("heading", { name: "この地域で確認できる場所" })).toBeVisible();

  await page.getByRole("button", { name: "子どもの居場所", exact: true }).click();
  const childFacility = page.locator(".resource-card").filter({ has: page.getByRole("heading", { name: "赤羽北児童館" }) });
  await expect(childFacility).toBeVisible();
  await childFacility.getByText("出典を見る", { exact: true }).click();
  await expect(childFacility).toContainText("東京都北区Open DataをStayBridge用に一部選定・正規化しています");
  await expect(childFacility.locator(".resource-source a").first()).toHaveAttribute("href", /^https?:\/\//);

  await page.getByRole("button", { name: "医療", exact: true }).click();
  const medical = page.locator(".resource-card").filter({ has: page.getByRole("heading", { name: "おうじキッズクリニック" }) });
  await expect(medical).toBeVisible();
  await expect(medical).toContainText("診療内容と予約の必要性は直接確認してください。");
  await medical.getByText("出典を見る", { exact: true }).click();
  await expect(medical.locator(".resource-source a").first()).toHaveAttribute("href", /^https?:\/\//);
});

test("AC-24–27, AC-29–30 Human Handoff and the fact-only consultation summary", async ({ page, context }) => {
  await demoRoadmap(page);
  await goHelp(page);
  await expect(page.getByText("人への相談", { exact: true })).toBeVisible();
  await page.locator(".safe-notice").getByText("公式相談", { exact: true }).click();
  await expect(page.locator(".safe-notice")).toContainText("在留手続や法律上の判断は、専門相談窓口で確認してください");
  const fresc = page.getByRole("heading", { name: "Foreign Residents Support Center (FRESC) contacts" });
  await expect(fresc).toBeVisible();
  await expect(fresc.locator("..").getByRole("link", { name: "公式サイトを見る" })).toHaveAttribute("href", /^https?:\/\//);

  await page.getByRole("button", { name: "相談内容をまとめる" }).click();
  await expect(page.getByRole("heading", { name: "相談員に見せるサマリー" })).toBeVisible();
  const sheet = page.locator(".summary-sheet");
  await expect(sheet).toContainText("地域: 北区");
  await expect(sheet).toContainText("ミャンマー");
  await expect(sheet).toContainText("帰国することが難しい");
  await expect(sheet).not.toContainText(/政治|迫害|難民/);

  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(USER_URL).origin });
  await page.getByRole("button", { name: "コピーする" }).click();
  await expect(page.getByRole("button", { name: /コピーしました/ })).toBeVisible();
});

test("AC-28 consultation summary retains the child age", async ({ page }) => {
  await demoRoadmap(page);
  await goHelp(page);
  await page.getByRole("button", { name: "相談内容をまとめる" }).click();
  await expect(page.locator(".summary-sheet")).toContainText("子どもがいる · 年齢: 6-11");
});
