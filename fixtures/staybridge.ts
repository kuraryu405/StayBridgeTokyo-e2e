import { expect, type Locator, type Page } from "@playwright/test";
import { MUNICIPALITY_URL, USER_URL } from "../helpers/targets";

export { MUNICIPALITY_URL, USER_URL };
/** Backwards-compatible alias for callers that only need the user target. */
export const BASE_URL = USER_URL;

export async function openHome(page: Page) {
  await page.goto(USER_URL);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: "今の状況を確認する" })).toBeVisible();
}

export async function openCrisis(page: Page) {
  await page.goto(MUNICIPALITY_URL);
  await expect(page.getByRole("heading", { name: /支援準備のために、\s*次に確認すること。/ })).toBeVisible();
}

export async function loadDemo(page: Page) {
  await openHome(page);
  await page.getByRole("button", { name: "デモの状況を読み込む" }).click();
  await expect(page.getByRole("heading", { name: "今の状況を整理しました" })).toBeVisible();
}

export async function demoRoadmap(page: Page) {
  await loadDemo(page);
  await page.getByRole("button", { name: "次のステップを見る" }).click();
  await expect(page.getByRole("heading", { name: "あなたの次のステップ" })).toBeVisible();
}

async function selectOption(page: Page, name: string) {
  await page.getByRole("radio", { name }).click();
  await page.getByRole("button", { name: "次へ" }).click();
}

/** Completes the public ten-question assessment, without injecting browser state. */
export async function completeSituation(
  page: Page,
  choices: {
    municipality?: string;
    nationality?: string;
    purpose?: string;
    departure?: string;
    returnStatus?: string;
    stayKnowledge?: string;
    family?: string;
    childAge?: string;
    accommodation?: string;
    needs?: string[];
    japanese?: string;
  } = {},
) {
  await openHome(page);
  await page.getByRole("button", { name: "今の状況を確認する" }).click();
  await expect(page.getByRole("heading", { name: "今、東京のどの地域に滞在していますか？" })).toBeVisible();
  await selectOption(page, choices.municipality || "北区");
  await selectOption(page, choices.nationality || "ミャンマー");
  await selectOption(page, choices.purpose || "旅行");
  await selectOption(page, choices.departure || "30日以内");
  await selectOption(page, choices.returnStatus || "帰国することが難しい");
  await selectOption(page, choices.stayKnowledge || "分からない");
  // The family screen exposes choice controls as checkboxes in the current UI,
  // whereas the preceding single-choice questions use radios.
  await page.getByRole("checkbox", { name: choices.family || "子どもがいる" }).click();
  if ((choices.family || "子どもがいる") === "子どもがいる") {
    await page.getByRole("button", { name: choices.childAge || "6-11", exact: true }).click();
  }
  await page.getByRole("button", { name: "次へ" }).click();
  await selectOption(page, choices.accommodation || "ホテル・宿泊施設");
  for (const need of choices.needs || ["日本にいつまでいられるか", "相談先"]) {
    await page.getByRole("checkbox", { name: need }).click();
  }
  await page.getByRole("button", { name: "次へ" }).click();
  await page.getByRole("radio", { name: choices.japanese || "少し話せる" }).click();
  await page.getByRole("button", { name: "状況を整理する" }).click();
  await expect(page.getByRole("heading", { name: "今の状況を整理しました" })).toBeVisible();
}

export async function roadmapCard(page: Page, heading: string): Promise<Locator> {
  const card = page.locator(".action-card").filter({ has: page.getByRole("heading", { name: heading }) });
  await expect(card).toBeVisible();
  return card;
}

export async function goLocal(page: Page) {
  await page.getByRole("button", { name: "近くの支援" }).click();
  await expect(page.getByRole("heading", { name: "この地域で確認できる場所" })).toBeVisible();
}

export async function goHelp(page: Page) {
  await page.getByRole("navigation", { name: "Primary" }).getByRole("button", { name: "相談先" }).click();
  await expect(page.getByRole("heading", { name: "人に相談する" })).toBeVisible();
}
