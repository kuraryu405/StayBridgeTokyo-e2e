import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import { EVIDENCE_ROOT, safeSegment } from "./metadata";
import { MUNICIPALITY_URL, TARGET_COMMIT, TARGET_URLS, USER_URL } from "../targets";

interface ResultRecord {
  id: string;
  title: string;
  file: string;
  project: string;
  scenario: string;
  status: string;
  durationMs: number;
  retry: number;
  errors: string[];
  artifacts: string[];
}

function scenarioFor(test: TestCase): string {
  const annotation = test.annotations.find(
    ({ type, description }) => type === "evidence" && description,
  )?.description;
  if (annotation && /^[a-z0-9][a-z0-9_-]*$/i.test(annotation)) return annotation;

  const segments = path.normalize(test.location.file).split(path.sep);
  const e2e = segments.lastIndexOf("e2e");
  return e2e >= 0 && segments[e2e + 1] ? segments[e2e + 1] : "unspecified";
}

function projectFor(test: TestCase): string {
  return test.parent.project()?.name ?? "unknown";
}

function titleSlug(test: TestCase): string {
  return safeSegment(test.title.replace(/@evidence/g, "").trim());
}

async function existingFile(filePath: string | undefined): Promise<boolean> {
  if (!filePath) return false;
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

export default class EvidenceReporter implements Reporter {
  private readonly startedAt = new Date().toISOString();
  private readonly records: ResultRecord[] = [];
  private rootDir = process.cwd();

  onBegin(_config: FullConfig, _suite: Suite): void {
    this.rootDir = process.cwd();
  }

  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    const project = projectFor(test);
    const scenario = safeSegment(scenarioFor(test));
    const slug = titleSlug(test);
    const isEvidence = /^evidence(?:-|$)/.test(project);
    const artifacts: string[] = [];

    for (const attachment of result.attachments) {
      if (!(await existingFile(attachment.path))) continue;

      let destination: string | undefined;
      if (attachment.name === "video" && isEvidence) {
        destination = path.join(EVIDENCE_ROOT, "videos", scenario, `${slug}.webm`);
      } else if (attachment.name === "trace" && isEvidence) {
        destination = path.join(EVIDENCE_ROOT, "traces", scenario, `${slug}.zip`);
      } else if (
        result.status !== test.expectedStatus &&
        attachment.contentType === "image/png"
      ) {
        destination = path.join(
          EVIDENCE_ROOT,
          "screenshots",
          scenario,
          `failure-${slug}.png`,
        );
      }

      if (!destination || !attachment.path) continue;
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(attachment.path, destination);
      artifacts.push(path.relative(this.rootDir, destination));

      // Stable presentation aliases required by the evidence contract.
      if (attachment.name === "video" && isEvidence && /full[- ]journey/i.test(test.title)) {
        const aliasName = scenario === "crisis" ? "crisis-preparedness.webm" : `${scenario}.webm`;
        const alias = path.join(EVIDENCE_ROOT, "videos", aliasName);
        await mkdir(path.dirname(alias), { recursive: true });
        await copyFile(attachment.path, alias);
        artifacts.push(path.relative(this.rootDir, alias));
      }
    }

    const errors = result.errors.map((error) => error.message ?? error.value ?? "Unknown error");
    this.records.push({
      id: test.id,
      title: test.title,
      file: path.relative(this.rootDir, test.location.file),
      project,
      scenario,
      status: result.status,
      durationMs: result.duration,
      retry: result.retry,
      errors,
      artifacts,
    });

    // Reconcile metadata written from the test's finally block with the final
    // Playwright result, which is unavailable while finalize() is running.
    if (isEvidence) {
      const runMetadataPath = path.join(
        EVIDENCE_ROOT,
        "metadata",
        scenario,
        `${safeSegment(test.id)}-run.json`,
      );
      let existing: Record<string, unknown> = {};
      try {
        existing = JSON.parse(await readFile(runMetadataPath, "utf8")) as Record<string, unknown>;
      } catch {
        // A test may fail before createEvidence/finalize gets a chance to write.
      }
      await mkdir(path.dirname(runMetadataPath), { recursive: true });
      await writeFile(
        runMetadataPath,
        `${JSON.stringify(
          {
            ...existing,
            scenario,
            project,
            test: test.title,
            file: path.relative(this.rootDir, test.location.file),
            finishedAt: new Date().toISOString(),
            status: result.status,
            expectedStatus: test.expectedStatus,
            errors,
            artifacts,
          },
          null,
          2,
        )}\n`,
        "utf8",
      );
    }

    if (errors.length) {
      const failureDirectory = path.join(EVIDENCE_ROOT, "metadata", "failures");
      await mkdir(failureDirectory, { recursive: true });
      await writeFile(
        path.join(failureDirectory, `${scenario}-${slug}.json`),
        `${JSON.stringify(this.records.at(-1), null, 2)}\n`,
        "utf8",
      );
    }
  }

  async onEnd(result: FullResult): Promise<void> {
    const counts = this.records.reduce(
      (summary, record) => {
        const key = record.status as keyof typeof summary;
        if (key in summary) summary[key] += 1;
        return summary;
      },
      { passed: 0, failed: 0, skipped: 0, timedOut: 0, interrupted: 0 },
    );
    const manifest = {
      target: USER_URL,
      userUrl: USER_URL,
      municipalityUrl: MUNICIPALITY_URL,
      targetUrls: TARGET_URLS,
      targetCommit: TARGET_COMMIT,
      startedAt: this.startedAt,
      finishedAt: new Date().toISOString(),
      status: result.status,
      tests: counts,
      results: this.records,
    };
    const reports = path.join(EVIDENCE_ROOT, "reports");
    await mkdir(reports, { recursive: true });
    await writeFile(
      path.join(reports, "run-manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );
  }
}
