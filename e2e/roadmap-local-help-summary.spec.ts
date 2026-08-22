import { expect, test } from "@playwright/test";
import { demoRoadmap, goHelp, roadmapCard } from "../fixtures/staybridge";
import { USER_URL } from "../helpers/targets";

test("AC-08–16 Persona A roadmap is prioritized, explained, and source-backed", async ({ page }) => {
  await demoRoadmap(page);
  await expect(page.getByRole("heading", { name: "TODAY · 今日" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "THIS WEEK · 今週" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "NEXT 30 DAYS · 当面" })).toBeVisible();

  const stay = await roadmapCard(page, "日本に滞在できる期間を確認する");
  await expect(stay).toContainText("個別の確認が必要");
  await expect(stay.getByRole("link").first()).toHaveAttribute("href", /^https?:\/\//);

  const education = await roadmapCard(page, "子どもの教育について相談する");
  await education.getByText("なぜこの案内？").click();
  await expect(education).toContainText("学齢期の子ども");
});

test("AC-17–23 Local Action shows schools, medical facilities and source/eligibility context", async ({ page }) => {
  await demoRoadmap(page);
  const education = await roadmapCard(page, "子どもの教育について相談する");
  await education.getByRole("button", { name: "近くの学校を見る" }).click();
  await expect(page.getByRole("heading", { name: "この地域で確認できる場所" })).toBeVisible();

  await page.getByRole("tab", { name: "学校・教育" }).click();
  const school = page.locator(".resource-card").filter({ has: page.getByRole("heading", { name: "豊川小学校" }) });
  await expect(school).toBeVisible();
  await expect(school).toContainText("Open Data source");
  await expect(school.getByRole("link", { name: /Kita City Board of Education/ })).toHaveAttribute("href", /^https?:\/\//);
  await expect(school).toContainText("入学・就学については自治体または教育機関への確認が必要です。");
  await expect(school).not.toContainText("入学できます");

  await page.getByRole("tab", { name: "医療" }).click();
  const medical = page.locator(".resource-card").filter({ has: page.getByRole("heading", { name: "おうじキッズクリニック" }) });
  await expect(medical).toBeVisible();
  await expect(medical).toContainText("Confirm services and appointment requirements directly.");
  await expect(medical.getByRole("link", { name: /Kita City Public Health Center/ })).toHaveAttribute("href", /^https?:\/\//);
});

test("AC-24–27, AC-29–30 Human Handoff and the fact-only consultation summary", async ({ page, context }) => {
  await demoRoadmap(page);
  await goHelp(page);
  await expect(page.getByText("人への相談", { exact: true })).toBeVisible();
  await expect(page.getByText("最終的な判断はしません")).toBeVisible();
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
