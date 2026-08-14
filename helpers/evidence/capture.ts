import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Page, TestInfo } from "@playwright/test";
import { EVIDENCE_ROOT, safeSegment, writeMetadata } from "./metadata";
import type { EvidenceCapture, EvidenceStepRecord } from "./types";

export interface CaptureContext {
  currentStep?: EvidenceStepRecord;
  startedAt: string;
}

export async function captureEvidence(
  page: Page,
  testInfo: TestInfo,
  input: EvidenceCapture,
  context: CaptureContext,
): Promise<string> {
  const scenario = safeSegment(input.scenario);
  const name = safeSegment(input.name);
  const directory = path.join(EVIDENCE_ROOT, "screenshots", scenario);
  const screenshotPath = path.join(directory, `${name}.png`);
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: false, animations: "disabled" });

  const viewport = page.viewportSize();
  const browserName = testInfo.project.use.browserName ?? "chromium";
  const metadataPath = await writeMetadata(scenario, name, {
    scenario,
    step: name,
    acceptanceCriteria: input.acceptance ?? context.currentStep?.acceptance ?? [],
    targetUrl: page.url(),
    targetCommit: process.env.TARGET_COMMIT || undefined,
    browser: browserName,
    project: testInfo.project.name,
    viewport: viewport ? `${viewport.width}x${viewport.height}` : "unknown",
    result: input.result ?? "PASS",
    timestamp: new Date().toISOString(),
    test: {
      title: testInfo.title,
      file: path.relative(process.cwd(), testInfo.file),
      retry: testInfo.retry,
    },
    runStartedAt: context.startedAt,
    evidenceStep: context.currentStep,
    screenshot: path.relative(process.cwd(), screenshotPath),
  });

  await testInfo.attach(`evidence-${scenario}-${name}`, {
    path: screenshotPath,
    contentType: "image/png",
  });
  await testInfo.attach(`evidence-metadata-${scenario}-${name}`, {
    path: metadataPath,
    contentType: "application/json",
  });

  return screenshotPath;
}
