import path from "node:path";
import type { Page } from "@playwright/test";
import { EVIDENCE_ROOT, safeSegment } from "./metadata";

/**
 * Returns the final meaningful destination used by the evidence reporter.
 * Video files only become complete after the browser context closes, so the
 * reporter performs the actual copy in onTestEnd rather than blocking a test.
 */
export function videoDestination(scenario: string, name?: string): string {
  const safeScenario = safeSegment(scenario);
  return path.join(
    EVIDENCE_ROOT,
    "videos",
    safeScenario,
    `${safeSegment(name ?? safeScenario)}.webm`,
  );
}

export function hasRecordedVideo(page: Page): boolean {
  return page.video() !== null;
}
