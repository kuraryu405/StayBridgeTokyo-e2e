import { expect, test } from "@playwright/test";
import { completeSituation, roadmapCard } from "../fixtures/staybridge";

test("AC-03–07 manual Situation Check accepts Persona A facts", async ({ page }) => {
  await completeSituation(page, { needs: ["日本にいつまでいられるか", "子どもの学校・教育"] });
  const review = page.locator(".status-list");
  for (const fact of ["地域: 北区", "国籍・地域: ミャンマー", "旅行", "30日以内", "帰国することが難しい", "ホテル・宿泊施設", "子どもがいる · 年齢: 6-11"]) {
    await expect(review).toContainText(fact);
  }
  await page.getByRole("button", { name: "次のステップを見る" }).click();
  await expect(await roadmapCard(page, "子どもの教育について相談する")).toBeVisible();
});
