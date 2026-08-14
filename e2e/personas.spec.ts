import { expect, test } from "@playwright/test";
import { completeSituation, roadmapCard } from "../fixtures/staybridge";

test("AC-11 Persona B: no child does not receive an education action", async ({ page }) => {
  await completeSituation(page, { family: "いない", needs: ["日本にいつまでいられるか"] });
  await page.getByRole("button", { name: "次のステップを見る" }).click();
  await expect(page.getByRole("heading", { name: "子どもの教育について相談する" })).toHaveCount(0);
});

test("Persona C: return possible does not produce the stranded-stay action", async ({ page }) => {
  await completeSituation(page, { returnStatus: "帰国できる", family: "いない", needs: ["相談先"] });
  await page.getByRole("button", { name: "次のステップを見る" }).click();
  await expect(page.getByRole("heading", { name: "日本に滞在できる期間を確認する" })).toHaveCount(0);
});

test("Persona D: medical need gives a medical local action", async ({ page }) => {
  await completeSituation(page, { family: "いない", needs: ["医療"] });
  await page.getByRole("button", { name: "次のステップを見る" }).click();
  const card = await roadmapCard(page, "医療を受けられる場所を確認する");
  await card.getByRole("button", { name: "近くの医療機関を見る" }).click();
  await page.getByRole("tab", { name: "医療" }).click();
  await expect(page.getByRole("heading", { name: "おうじキッズクリニック" })).toBeVisible();
});

test("AC-12 / SAFE-04 Persona E checks work eligibility before job search", async ({ page }) => {
  await completeSituation(page, { family: "いない", needs: ["仕事"] });
  await page.getByRole("button", { name: "次のステップを見る" }).click();
  const card = await roadmapCard(page, "働ける条件を先に確認する");
  await expect(card).toContainText("仕事を探す前に");
  await expect(card).not.toContainText("求人を検索");
});
