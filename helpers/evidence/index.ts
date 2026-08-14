import path from "node:path";
import type { Locator, Page, TestInfo } from "@playwright/test";
import { captureEvidence } from "./capture";
import { markClick } from "./click-marker";
import { writeMetadata } from "./metadata";
import { clearOverlay, installOverlay, showOverlay } from "./overlay";
import type {
  EvidenceCapture,
  EvidenceResult,
  EvidenceStep,
  EvidenceStepRecord,
  EvidenceVerification,
} from "./types";

export type { EvidenceCapture, EvidenceStep, EvidenceVerification } from "./types";
export { OVERLAY_ID } from "./overlay";

export interface EvidenceClickOptions extends Partial<EvidenceStep> {
  label?: string;
  timeout?: number;
}

export interface EvidenceFinalizeOptions {
  scenario?: string;
  videoName?: string;
}

export interface Evidence {
  readonly enabled: boolean;
  step(input: EvidenceStep): Promise<void>;
  click(locator: Locator, input?: EvidenceClickOptions): Promise<void>;
  navigate(url: string, input?: EvidenceClickOptions): Promise<void>;
  logicalNavigation(from: string, to: string): Promise<void>;
  verify(
    input: EvidenceVerification | string,
    acceptanceOrAssertion?: string[] | (() => Promise<void>),
    assertion?: () => Promise<void>,
  ): Promise<void>;
  pass(detail: string, acceptance?: string[]): Promise<void>;
  fail(detail: string, error?: unknown, acceptance?: string[]): Promise<void>;
  capture(input: EvidenceCapture): Promise<string | null>;
  pause(milliseconds?: number): Promise<void>;
  finalize(options?: EvidenceFinalizeOptions): Promise<void>;
  clear(): Promise<void>;
}

export function isEvidenceProject(projectName: string): boolean {
  return /^evidence(?:-|$)/.test(projectName);
}

function inferScenario(testInfo: TestInfo): string {
  const segments = path.normalize(testInfo.file).split(path.sep);
  const e2eIndex = segments.lastIndexOf("e2e");
  return e2eIndex >= 0 && segments[e2eIndex + 1]
    ? segments[e2eIndex + 1]
    : "unspecified";
}

function messageFor(error: unknown): string {
  if (error instanceof Error) return error.message.split("\n")[0] ?? error.name;
  return String(error);
}

class EvidenceController implements Evidence {
  readonly enabled: boolean;
  private readonly ready: Promise<void>;
  private readonly startedAt = new Date().toISOString();
  private readonly steps: EvidenceStepRecord[] = [];
  private currentStep?: EvidenceStepRecord;
  private lastUrl: string;
  private failed = false;

  constructor(
    private readonly page: Page,
    private readonly testInfo: TestInfo,
  ) {
    this.enabled = isEvidenceProject(testInfo.project.name);
    this.lastUrl = page.url();
    this.ready = this.enabled ? installOverlay(page) : Promise.resolve();

    if (this.enabled) {
      page.on("framenavigated", (frame) => {
        if (frame !== page.mainFrame()) return;
        const from = this.lastUrl;
        const to = frame.url();
        this.lastUrl = to;
        if (from && from !== "about:blank" && from !== to) {
          void this.logicalNavigation(from, to).catch(() => undefined);
        }
      });
    }
  }

  async step(input: EvidenceStep): Promise<void> {
    this.finishCurrentStep("INFO");
    this.currentStep = { ...input, startedAt: new Date().toISOString() };
    this.steps.push(this.currentStep);
    this.log("STEP", input.detail ?? input.action, input.acceptance, input.step);
    if (!this.enabled) return;
    await this.ready;
    await showOverlay(this.page, { kind: "STEP", ...input });
    await this.pause(450);
  }

  async click(locator: Locator, input: EvidenceClickOptions = {}): Promise<void> {
    const detail = input.label ?? input.detail ?? locator.toString();
    if (input.step !== undefined) {
      await this.step({
        step: input.step,
        total: input.total,
        acceptance: input.acceptance,
        action: input.action ?? "CLICK",
        detail,
        verify: input.verify,
      });
    } else {
      this.log("CLICK", detail, input.acceptance ?? this.currentStep?.acceptance);
      if (this.enabled) {
        await this.ready;
        await showOverlay(this.page, {
          kind: "STEP",
          step: this.currentStep?.step,
          total: this.currentStep?.total,
          acceptance: input.acceptance ?? this.currentStep?.acceptance,
          action: input.action ?? "CLICK",
          detail,
          verify: input.verify,
        });
      }
    }

    if (this.enabled) {
      await markClick(this.page, locator);
      await this.pause(350);
    }
    const before = this.page.url();
    await locator.click({ timeout: input.timeout });
    if (this.enabled) await this.pause(500);
    const after = this.page.url();
    if (before !== after) await this.logicalNavigation(before, after);
  }

  async navigate(url: string, input: EvidenceClickOptions = {}): Promise<void> {
    const from = this.page.url();
    if (input.step !== undefined) {
      await this.step({
        step: input.step,
        total: input.total,
        acceptance: input.acceptance,
        action: input.action ?? "NAVIGATE",
        detail: input.label ?? input.detail ?? url,
        verify: input.verify,
      });
    }
    await this.page.goto(url);
    await this.logicalNavigation(from, this.page.url());
  }

  async logicalNavigation(from: string, to: string): Promise<void> {
    if (from === to) return;
    this.log("NAVIGATION", `${from} → ${to}`);
    this.lastUrl = to;
    if (!this.enabled || this.page.isClosed()) return;
    await this.ready;
    await showOverlay(this.page, { kind: "NAVIGATION", action: "NAVIGATION", from, to });
    await this.pause(550);
  }

  async verify(
    input: EvidenceVerification | string,
    acceptanceOrAssertion?: string[] | (() => Promise<void>),
    assertion?: () => Promise<void>,
  ): Promise<void> {
    const options: EvidenceVerification =
      typeof input === "string"
        ? {
            description: input,
            acceptance: Array.isArray(acceptanceOrAssertion)
              ? acceptanceOrAssertion
              : this.currentStep?.acceptance,
          }
        : input;
    const runAssertion =
      typeof acceptanceOrAssertion === "function" ? acceptanceOrAssertion : assertion;

    this.log("VERIFY", options.description, options.acceptance);
    if (this.enabled) {
      await this.ready;
      await showOverlay(this.page, {
        kind: "VERIFY",
        step: this.currentStep?.step,
        total: this.currentStep?.total,
        acceptance: options.acceptance ?? this.currentStep?.acceptance,
        action: "VERIFY",
        detail: options.description,
      });
      await this.pause(400);
    }

    if (!runAssertion) return;

    try {
      await runAssertion();
      await this.pass(options.description, options.acceptance);
      if (options.capture) {
        await this.capture({
          ...options.capture,
          acceptance: options.acceptance,
          result: "PASS",
        });
      }
    } catch (error) {
      await this.fail(options.description, error, options.acceptance);
      if (this.enabled) {
        await this.capture({
          scenario: options.capture?.scenario ?? inferScenario(this.testInfo),
          name: options.capture?.name
            ? `${options.capture.name}-failure`
            : `failure-${Date.now()}`,
          acceptance: options.acceptance,
          result: "FAIL",
        }).catch(() => undefined);
      }
      throw error;
    }
  }

  async pass(detail: string, acceptance?: string[]): Promise<void> {
    this.finishCurrentStep("PASS");
    const criteria = acceptance ?? this.currentStep?.acceptance;
    this.log("PASS", detail, criteria);
    if (!this.enabled) return;
    await this.ready;
    await showOverlay(this.page, {
      kind: "PASS",
      step: this.currentStep?.step,
      total: this.currentStep?.total,
      acceptance: criteria,
      detail,
    });
    await this.pause(600);
  }

  async fail(detail: string, error?: unknown, acceptance?: string[]): Promise<void> {
    this.failed = true;
    this.finishCurrentStep("FAIL");
    const actual = error ? messageFor(error) : "Verification failed";
    const criteria = acceptance ?? this.currentStep?.acceptance;
    this.log("FAIL", `${detail}: ${actual}`, criteria);
    if (!this.enabled || this.page.isClosed()) return;
    await this.ready;
    await showOverlay(this.page, {
      kind: "FAIL",
      step: this.currentStep?.step,
      total: this.currentStep?.total,
      acceptance: criteria,
      detail,
      expected: detail,
      actual,
    });
    await this.pause(750);
  }

  async capture(input: EvidenceCapture): Promise<string | null> {
    if (!this.enabled || this.page.isClosed()) return null;
    await this.ready;
    const result = await captureEvidence(this.page, this.testInfo, input, {
      currentStep: this.currentStep,
      startedAt: this.startedAt,
    });
    this.log("CAPTURE", path.relative(process.cwd(), result), input.acceptance);
    return result;
  }

  async pause(milliseconds = 500): Promise<void> {
    if (!this.enabled || this.page.isClosed()) return;
    const bounded = Math.max(0, Math.min(milliseconds, 2_000));
    if (bounded > 0) await this.page.waitForTimeout(bounded);
  }

  async finalize(options: EvidenceFinalizeOptions = {}): Promise<void> {
    const failed = this.failed || this.testInfo.errors.length > 0;
    this.finishCurrentStep(failed ? "FAIL" : "PASS");
    if (!this.enabled) return;
    const scenario = options.scenario ?? inferScenario(this.testInfo);
    await writeMetadata(scenario, `${this.testInfo.testId}-run`, {
      scenario,
      videoName: options.videoName,
      target: process.env.BASE_URL ?? "http://localhost:3000",
      targetCommit: process.env.TARGET_COMMIT || undefined,
      project: this.testInfo.project.name,
      test: this.testInfo.title,
      file: path.relative(process.cwd(), this.testInfo.file),
      startedAt: this.startedAt,
      finishedAt: new Date().toISOString(),
      // testInfo.status is updated only after the test body (and therefore this
      // finally block) completes. Controller failure state is authoritative
      // here; the reporter reconciles this again with Playwright's final result.
      status: failed ? "failed" : "passed",
      steps: this.steps,
    });
  }

  async clear(): Promise<void> {
    if (!this.enabled) return;
    await clearOverlay(this.page);
  }

  private finishCurrentStep(result: EvidenceResult): void {
    if (!this.currentStep || this.currentStep.finishedAt) return;
    this.currentStep.finishedAt = new Date().toISOString();
    this.currentStep.result = result;
  }

  private log(kind: string, detail: string, acceptance?: string[], step?: number): void {
    const stepPart = step !== undefined ? `[STEP ${String(step).padStart(2, "0")}]` : "";
    const criteria = acceptance?.length ? `[${acceptance.join(",")}]` : "";
    console.log(`${stepPart}${criteria}[${kind}] ${detail}`);
  }
}

export function createEvidence(page: Page, testInfo: TestInfo): Evidence {
  return new EvidenceController(page, testInfo);
}

export async function evidencePause(
  page: Page,
  testInfo: TestInfo,
  milliseconds = 500,
): Promise<void> {
  if (isEvidenceProject(testInfo.project.name)) await page.waitForTimeout(milliseconds);
}
