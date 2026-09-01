import { expect, type Locator, type Page } from "@playwright/test";
import { MUNICIPALITY_URL, USER_URL } from "../helpers/targets";

export { MUNICIPALITY_URL, USER_URL };
/** Backwards-compatible alias for callers that only need the user target. */
export const BASE_URL = USER_URL;
export const firstQuestionHeading = "東京のどの地域に滞在していますか？";
export const wardSearchLabel = "東京23区から選択";
const nationalitySearchLabel = "国名・地域名から選択";
const myanmarOption = "ミャンマー (ビルマ)";
const questionHeadings = {
  nationality: "国籍・地域を教えてください。",
  purpose: "日本にはどのような予定で来ましたか？",
  departure: "日本をいつ出る予定でしたか？",
  returnStatus: "予定どおり帰国できますか？",
  stayKnowledge: "日本にいつまで滞在できるか分かりますか？",
  family: "一緒に日本にいる家族はいますか？",
  accommodation: "どこに滞在していますか？",
  needs: "現在困っていることは何ですか？",
  japanese: "日本語をどのくらい話せますか？",
};

export async function openHome(page: Page) {
  await page.goto(USER_URL, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "今の状況を確認する" })).toBeVisible();
  await page.waitForLoadState("networkidle");
}

export async function openCrisis(page: Page) {
  await page.goto(MUNICIPALITY_URL);
  await expect(page.getByRole("heading", { name: /支援準備のために、\s*次に確認すること。/ })).toBeVisible();
}

export async function loadDemo(page: Page) {
  await openHome(page);
  await page.getByRole("button", { name: "デモの状況を読み込む" }).click();
  await expect(page.getByRole("heading", { name: "回答を確認して、次の行動へ進みましょう" })).toBeVisible();
}

export async function demoRoadmap(page: Page) {
  await loadDemo(page);
  await page.getByRole("button", { name: "次のステップを見る" }).click();
  await expect(page.getByRole("heading", { name: "あなたの次のステップ" })).toBeVisible();
}

async function chooseRadio(page: Page, name: string) {
  const radio = page.getByRole("radio", { name });
  await radio.locator("xpath=ancestor::label[1]").getByText(name, { exact: true }).click();
  await expect(radio).toBeChecked();
}

async function chooseCheckbox(page: Page, name: string) {
  const checkbox = page.getByRole("checkbox", { name });
  await checkbox.locator("xpath=ancestor::label[1]").getByText(name, { exact: true }).click();
  await expect(checkbox).toBeChecked();
}

async function chooseSearchOption(page: Page, label: string, name: string) {
  const combobox = page.getByRole("combobox", { name: label });
  await combobox.click();
  await combobox.fill(name.slice(0, -1));
  await page.getByRole("listbox", { name: label }).getByRole("option", { name, exact: true }).click();
  await expect(combobox).toHaveValue(name);
}

async function advanceToQuestion(page: Page, heading: string) {
  const next = page.getByRole("button", { name: "次へ" });
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
}

async function selectOption(page: Page, name: string, nextHeading: string) {
  await chooseRadio(page, name);
  await advanceToQuestion(page, nextHeading);
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
  await expect(page.getByRole("heading", { name: firstQuestionHeading })).toBeVisible();
  await chooseSearchOption(page, wardSearchLabel, choices.municipality || "北区");
  await advanceToQuestion(page, questionHeadings.nationality);
  await chooseSearchOption(page, nationalitySearchLabel, choices.nationality || myanmarOption);
  await advanceToQuestion(page, questionHeadings.purpose);
  await selectOption(page, choices.purpose || "旅行", questionHeadings.departure);
  await selectOption(page, choices.departure || "30日以内", questionHeadings.returnStatus);
  await selectOption(page, choices.returnStatus || "帰国することが難しい", questionHeadings.stayKnowledge);
  await selectOption(page, choices.stayKnowledge || "分からない", questionHeadings.family);
  // The family screen exposes choice controls as checkboxes in the current UI,
  // whereas the preceding single-choice questions use radios.
  await chooseCheckbox(page, choices.family || "子どもがいる");
  if ((choices.family || "子どもがいる") === "子どもがいる") {
    await chooseCheckbox(page, choices.childAge || "6-11");
  }
  await advanceToQuestion(page, questionHeadings.accommodation);
  await selectOption(page, choices.accommodation || "ホテル・宿泊施設", questionHeadings.needs);
  for (const need of choices.needs || ["日本にいつまでいられるか", "相談先"]) {
    await chooseCheckbox(page, need);
  }
  await advanceToQuestion(page, questionHeadings.japanese);
  await chooseRadio(page, choices.japanese || "少し話せる");
  const finish = page.getByRole("button", { name: "状況を整理する" });
  await expect(finish).toBeEnabled();
  await finish.click();
  await expect(page.getByRole("heading", { name: "回答を確認して、次の行動へ進みましょう" })).toBeVisible();
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
  await page.getByRole("button", { name: "相談先", exact: true }).click();
  await expect(page.getByRole("heading", { name: "人に相談する" })).toBeVisible();
}
