import { expect, test, type Page } from "@playwright/test";
import { MUNICIPALITY_URL, USER_URL } from "../helpers/targets";

const localeCopy = {
  ja: { demo: "デモの状況を読み込む", roadmap: "次のステップを見る", assistant: "確認済み情報アシスタント", ask: "質問する", decline: "保存しない", local: "地域情報を開く", help: "人的相談を開く" },
  en: { demo: "Load demo situation", roadmap: "See my next steps", assistant: "Verified information assistant", ask: "Ask", decline: "Do not save", local: "Open local support", help: "Open human support" },
  my: { demo: "ဒေမို", roadmap: "နောက်", assistant: "အတည်ပြုအချက်အလက်", ask: "မေးရန်", decline: "မသိမ်းရန်", local: "ဒေသ", help: "တိုင်ပင်" },
} as const;

async function openDemoRoadmap(page: Page, locale: keyof typeof localeCopy = "ja") {
  await page.goto(USER_URL, { waitUntil: "domcontentloaded" });
  await page.locator("select").selectOption(locale);
  await page.getByRole("button", { name: new RegExp(localeCopy[locale].demo) }).click();
  await page.getByRole("button", { name: new RegExp(localeCopy[locale].roadmap) }).click();
  await expect(page.getByRole("heading", { name: new RegExp(localeCopy[locale].assistant) })).toBeVisible();
}

test.describe("Issue #60: Crisis View voluntary needs", () => {
  test("staging fixture separates official data, exposes allowlisted axes, and renders an eligible aggregate", async ({ page }) => {
    await page.goto(MUNICIPALITY_URL, { waitUntil: "domcontentloaded" });
    const official = page.getByTestId("crisis-official-data");
    const voluntary = page.getByTestId("crisis-voluntary-needs");
    await expect(official).toBeVisible();
    await expect(voluntary).toBeVisible();
    await expect(official).toContainText(/VERIFIED CACHE|確認を始める地域/);
    await expect(voluntary).toContainText(/VOLUNTARY STAYBRIDGE RESPONSES|任意回答/);
    await expect(voluntary).toContainText(/公式Open Dataとは別|NOT OFFICIAL OPEN DATA/);
    const controls = voluntary.locator(".crisis-needs-controls");
    await controls.getByRole("combobox").nth(0).selectOption("7d");
    await controls.getByRole("combobox").nth(1).selectOption("return_status");
    await expect(voluntary.getByTestId("crisis-needs-available")).toBeVisible();
    await expect(voluntary.getByTestId("crisis-needs-available")).toContainText(/回答者数\s*[5-9]|回答者数\s*[1-9]\d+/);
    await expect(voluntary.getByTestId("crisis-needs-coverage")).toBeVisible();
    await controls.getByRole("combobox").nth(1).selectOption("needs");
    await expect(voluntary.getByTestId("crisis-needs-available")).toBeVisible();
    await expect(voluntary.locator(".crisis-needs-categories li").first()).toBeVisible();
  });

  test("Crisis View is horizontally contained on 390px and shows the API-error state without exposing records", async ({ page }) => {
    await page.route("**/api/crisis/needs?**", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false }) }));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(MUNICIPALITY_URL, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("crisis-needs-error")).toBeVisible();
    await expect(page.getByTestId("crisis-needs-error")).toContainText(/個別の情報は表示せず|individual/i);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});

test.describe("Issue #62: verified assistant", () => {
  test("normal staging response cites verified metadata and preserves the no-consent path", async ({ page }) => {
    await openDemoRoadmap(page);
    const assistant = page.locator(".verified-assistant");
    await page.getByRole("button", { name: localeCopy.ja.decline }).click();
    await expect(page.locator(".conversation-consent output")).toContainText(/同意しない|保存しない/);
    const request = page.waitForRequest((candidate) => candidate.url().includes("/api/verified-assistant") && candidate.method() === "POST");
    const input = assistant.getByRole("textbox");
    await input.fill("北区の避難所を確認したい");
    await input.dispatchEvent("keydown", { key: "Enter", isComposing: true });
    await expect(assistant.locator(".assistant-reply")).toHaveCount(0, { timeout: 1_000 });
    await input.press("Enter");
    const sent = await request;
    expect(sent.postData() || "").not.toContain("conversation");
    const reply = assistant.locator(".assistant-reply");
    await expect(reply).toBeVisible();
    const source = reply.locator(".assistant-source").first();
    await expect(source.getByRole("link")).toHaveAttribute("href", /^https:\/\//);
    await expect(source).toContainText(/Updated:|更新/);
    await expect(source).toContainText(/Fetched:|取得/);
    await expect(source).toContainText(/確認|開設|coverage|注意/i);
    await expect(reply.getByRole("heading", { name: /注意点|Important limitation/ })).toBeVisible();
  });

  test("Japanese, English, and Myanmar assistant entry points are visible and usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const locale of ["ja", "en", "my"] as const) {
      await openDemoRoadmap(page, locale);
      const assistant = page.locator(".verified-assistant");
      await assistant.getByRole("textbox").fill("support information");
      await expect(assistant.getByRole("button", { name: new RegExp(localeCopy[locale].ask) })).toBeEnabled();
      await expect(assistant.getByRole("textbox")).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });

  test("assistant API failure leaves local and human handoff controls available", async ({ page }) => {
    await page.route("**/api/verified-assistant", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false }) }));
    await openDemoRoadmap(page);
    const assistant = page.locator(".verified-assistant");
    await assistant.getByRole("textbox").fill("避難所を確認したい");
    await assistant.getByRole("button", { name: localeCopy.ja.ask }).click();
    await expect(assistant.locator("output")).toContainText(/回答を取得できません|Rule Engine/);
    await expect(assistant.getByRole("button", { name: localeCopy.ja.local })).toBeEnabled();
    await expect(assistant.getByRole("button", { name: localeCopy.ja.help })).toBeEnabled();
  });
});
