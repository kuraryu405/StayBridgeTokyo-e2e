import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

interface CaptureMetadata {
  scenario?: string;
  step?: string;
  acceptanceCriteria?: string[];
  result?: string;
  screenshot?: string;
  timestamp?: string;
  runStartedAt?: string;
  project?: string;
  test?: { title?: string; file?: string };
}

interface RunMetadata {
  scenario?: string;
  project?: string;
  test?: string;
  startedAt?: string;
  finishedAt?: string;
  status?: string;
  errors?: string[];
}

interface FailureMetadata {
  scenario?: string;
  title?: string;
  project?: string;
  status?: string;
}

interface EvidenceRow {
  id: string;
  scenario: string;
  test: string;
  screenshot?: string;
  video?: string;
  status: "PASS" | "FAIL" | "Known Gap" | "NOT RUN";
  note: string;
}

const KNOWN_GAPS = new Map([
  [
    "AC-35",
    "Kita is currently a fixed section; no distinct municipality detail can be opened or navigated to.",
  ],
  [
    "AC-41",
    "The current Data Gap view covers visitor visibility, language and capacity, but not explicit real demand.",
  ],
]);

const FUNCTIONAL_ONLY = new Set([
  "AC-03",
  "AC-04",
  "AC-05",
  "AC-06",
  "AC-07",
  "AC-11",
]);

async function jsonFiles(directory: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  const nested = await Promise.all(
    entries.map((entry) => {
      const child = path.join(directory, entry.name);
      return entry.isDirectory()
        ? jsonFiles(child)
        : Promise.resolve(child.endsWith(".json") ? [child] : []);
    }),
  );
  return nested.flat();
}

async function readJson<T>(file: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (error) {
    console.warn(`Skipping invalid evidence metadata ${file}: ${String(error)}`);
    return undefined;
  }
}

async function exists(file: string | undefined): Promise<boolean> {
  if (!file) return false;
  try {
    return (await stat(path.resolve(process.cwd(), file))).isFile();
  } catch {
    return false;
  }
}

function timestamp(value: string | undefined): number {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function scenarioFor(id: string): string {
  if (id.startsWith("SAFE-")) return id === "SAFE-07" ? "crisis" : "safety";
  const number = Number(id.slice(3));
  if (number >= 31) return "crisis";
  if (id === "AC-11") return "persona-b";
  if (id === "AC-12") return "persona-e";
  return "persona-a";
}

function videoFor(scenario: string): string | undefined {
  if (scenario === "persona-a") return path.join("evidence", "videos", "persona-a.webm");
  if (scenario === "crisis") {
    return path.join("evidence", "videos", "crisis-preparedness.webm");
  }
  return undefined;
}

function escapeCell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function markdownLink(fromFile: string, target: string | undefined, label: string): string {
  if (!target) return "—";
  const relative = path.relative(path.dirname(fromFile), path.resolve(process.cwd(), target));
  return `[${label}](${relative.split(path.sep).join("/")})`;
}

function criterionIds(): string[] {
  return [
    ...Array.from({ length: 43 }, (_, index) => `AC-${String(index + 1).padStart(2, "0")}`),
    ...Array.from({ length: 7 }, (_, index) => `SAFE-${String(index + 1).padStart(2, "0")}`),
  ];
}

async function main(): Promise<void> {
  const outputArgument = process.argv.find((argument) => argument.startsWith("--output="));
  const output = path.resolve(
    process.cwd(),
    outputArgument?.slice("--output=".length) || "docs/evidence-matrix.md",
  );
  const metadataRoot = path.resolve(process.cwd(), "evidence/metadata");
  const files = await jsonFiles(metadataRoot);

  const captures: CaptureMetadata[] = [];
  const runs: RunMetadata[] = [];
  const failures: Array<FailureMetadata & { modifiedAt: number }> = [];
  for (const file of files) {
    if (file.includes(`${path.sep}failures${path.sep}`)) {
      const failure = await readJson<FailureMetadata>(file);
      if (failure) failures.push({ ...failure, modifiedAt: (await stat(file)).mtimeMs });
      continue;
    }
    if (file.endsWith("-run.json")) {
      const run = await readJson<RunMetadata>(file);
      if (run?.scenario) runs.push(run);
      continue;
    }
    const capture = await readJson<CaptureMetadata>(file);
    if (capture?.scenario && Array.isArray(capture.acceptanceCriteria)) captures.push(capture);
  }

  // Only the latest journey attempt for each scenario can authorize PASS.
  // Older successful captures are deliberately ignored after a newer failure.
  const latestRun = new Map<string, RunMetadata>();
  for (const run of runs) {
    const current = latestRun.get(run.scenario!);
    if (!current || timestamp(run.startedAt ?? run.finishedAt) > timestamp(current.startedAt ?? current.finishedAt)) {
      latestRun.set(run.scenario!, run);
    }
  }

  for (const [scenario, run] of latestRun) {
    const startedAt = timestamp(run.startedAt ?? run.finishedAt);
    const staleFailure = failures.find(
      (failure) =>
        failure.scenario === scenario &&
        (!run.test || failure.title === run.test) &&
        failure.modifiedAt >= startedAt,
    );
    if (staleFailure) {
      run.status = "failed";
      run.errors = ["Playwright reporter recorded a failure for this run."];
    }
  }

  const rows: EvidenceRow[] = [];
  for (const id of criterionIds()) {
    const plannedScenario = scenarioFor(id);
    const knownGap = KNOWN_GAPS.get(id);
    if (knownGap) {
      rows.push({
        id,
        scenario: plannedScenario,
        test: plannedScenario === "crisis" ? "crisis full journey" : "acceptance test",
        status: "Known Gap",
        note: knownGap,
      });
      continue;
    }

    const candidates = captures
      .filter((capture) => capture.acceptanceCriteria?.includes(id))
      .sort((a, b) => timestamp(b.timestamp) - timestamp(a.timestamp));
    let selected: CaptureMetadata | undefined;
    let selectedRun: RunMetadata | undefined;
    for (const candidate of candidates) {
      const run = latestRun.get(candidate.scenario!);
      if (!run) continue;
      if (candidate.runStartedAt && run.startedAt && candidate.runStartedAt !== run.startedAt) continue;
      selected = candidate;
      selectedRun = run;
      break;
    }

    const scenario = selected?.scenario ?? plannedScenario;
    const screenshotValid = await exists(selected?.screenshot);
    const candidateVideo = videoFor(scenario);
    const videoValid = await exists(candidateVideo);
    let status: EvidenceRow["status"] = "NOT RUN";
    let note = FUNCTIONAL_ONLY.has(id)
      ? "Functional-only; no accepted Evidence artifact in the latest run."
      : "No accepted evidence from the latest scenario run.";
    if (selected && selectedRun) {
      if (selectedRun.status !== "passed") {
        status = "FAIL";
        note = `Latest ${scenario} journey ended ${selectedRun.status ?? "without a final result"}; earlier step PASS metadata is not accepted.`;
      } else if (selected.result !== "PASS") {
        status = "FAIL";
        note = `Latest deterministic checkpoint result is ${selected.result ?? "unknown"}.`;
      } else if (!screenshotValid) {
        status = "FAIL";
        note = "Metadata claims PASS, but its screenshot artifact is missing.";
      } else {
        status = "PASS";
        note = videoValid ? "Latest completed run and artifacts verified." : "Screenshot verified; meaningful video alias is missing.";
      }
    }

    rows.push({
      id,
      scenario,
      test:
        selected?.test?.title ??
        selected?.step ??
        (FUNCTIONAL_ONLY.has(id) ? "functional-only" : "planned acceptance test"),
      screenshot: screenshotValid ? selected?.screenshot : undefined,
      // An alias existing for this scenario does not prove an uncaptured AC is
      // present in that video. Link it only when current-run metadata selected
      // a checkpoint for this criterion (PASS or explicit failure evidence).
      video: selected && selectedRun && videoValid ? candidateVideo : undefined,
      status,
      note,
    });
  }

  const lines = [
    "# Evidence Matrix",
    "",
    "Generated from the latest scenario run only. A metadata `PASS` is published only when the final Playwright run passed and the referenced screenshot exists. Video links are emitted only for files that exist.",
    "",
    "`AC-35` and strict `AC-41` remain explicit Known Gaps until the public UI meets those requirements.",
    "",
    "| Criterion | Scenario | Test | Screenshot | Video | Status | Integrity note |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| ${row.id} | ${escapeCell(row.scenario)} | ${escapeCell(row.test)} | ${markdownLink(output, row.screenshot, "screenshot")} | ${markdownLink(output, row.video, "video")} | ${row.status} | ${escapeCell(row.note)} |`,
    ),
    "",
    `Generated at ${new Date().toISOString()}.`,
  ];

  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${rows.length} integrity-checked evidence rows to ${path.relative(process.cwd(), output)}`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
