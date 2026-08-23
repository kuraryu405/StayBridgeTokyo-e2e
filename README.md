# StayBridge Acceptance Tests

## Purpose

This repository independently verifies the public StayBridge Tokyo web experience and preserves reviewable evidence of each browser action and visible result. It tests the same interface a user receives: a browser over HTTP.

The intended trace is:

```text
Requirement → Acceptance Criterion → Persona → Browser action
→ Visible result → Playwright assertion → Screenshot / Video / Trace
```

An automated `PASS` is not, by itself, the evidence. The Playwright assertion is the source of truth; the overlay explains that assertion and the surrounding action to a human reviewer.

## Why a Separate Repository?

StayBridge Tokyo owns the application, rule engine, adapters, UI, and lower-level tests. This repository owns only public-interface acceptance testing and evidence generation.

It must not import or read application components, rule-engine code, internal fixtures, database state, or private application state. Tests interact only with observable, user-accessible UI over HTTP. If the UI is difficult to test, the gap is recorded in [docs/testability-gaps.md](docs/testability-gaps.md); this repository does not modify the target application.

## What is StayBridge Tokyo?

StayBridge Tokyo is a life-rebuilding navigator for a visitor who cannot return home as planned after war, political upheaval, or a major disruption. The personal flow turns a stated situation into a prioritized roadmap, reasons, local resources, human support, and a consultation summary. The preparedness view helps public-sector reviewers consider population context, existing resources, coverage limits, data gaps, and preparation actions without inferring individual legal status or service eligibility.

## Verification Architecture

```text
StayBridge deployment
        ↓ HTTP
Playwright browser (black box)
        ↓
Persona or preparedness scenario
        ↓
Deterministic assertion
        ↓
Screenshot + Video + Trace + Metadata
        ↓
Evidence matrix + HTML report
```

See [docs/architecture.md](docs/architecture.md) for the full data flow and repository boundary.

## Persona A

The central scenario is a synthetic 34-year-old Myanmar national travelling in Tokyo with a six-year-old child. They planned to return within 30 days, now find return difficult, are staying in a hotel, have no permanent home or job in Japan, have beginner Japanese, and need help with stay status, consultation, accommodation, education, medical care, and employment questions.

Two paths cover this persona:

- Fast demo: load the application's demo situation and review the complete journey.
- Full input: enter every situation answer through the public UI, one question at a time.

Persona A is fictional and must never be presented as a real person or as proof of a real user's experience.

## Acceptance Criteria

[docs/acceptance-criteria.md](docs/acceptance-criteria.md) defines AC-01–AC-43 and SAFE-01–SAFE-07, including persona, automation, planned evidence, and priority. [docs/scenarios.md](docs/scenarios.md) maps Personas A–E and the preparedness journey to those criteria.

Current execution and evidence status is tracked in [docs/evidence-matrix.md](docs/evidence-matrix.md). `NOT RUN` means no result or artifact is claimed. `Known Gap` identifies an observed product/testability divergence, not a passing result.

## Functional Test

Functional mode is optimized for fast deterministic checks. It does not inject the evidence overlay, and retains screenshots, video, and trace on failure.

```bash
pnpm test
```

Useful focused commands:

```bash
pnpm test:persona
pnpm test:crisis
pnpm test:headed
pnpm test:ui
```

The focused staging coverage for Issues #60 and #62 is documented in
[docs/staging-issues-60-62.md](docs/staging-issues-60-62.md). It needs the
synthetic anonymous-aggregate fixture deployed by the application workflow.

## Evidence Mode

Evidence mode runs the tagged review journeys in mobile and admin-sized Chromium projects. It enables the operation overlay, human-readable pauses, screenshots, video on successful and failed runs, trace, metadata, and an HTML report.

```bash
pnpm test:evidence
pnpm evidence:matrix
```

Evidence mode is deliberately slower only at important review points. It does not replace deterministic assertions with visual or AI judgment.

## Operation Overlay

The overlay is injected by Playwright into the browser DOM; it is not part of StayBridge Tokyo. It is visually labelled `QA EVIDENCE` and uses a non-interactive, top-left layer above the application.

It displays:

- `STEP` and total step count
- acceptance criterion IDs
- current `ACTION` or `CLICK`
- navigation from the previous URL to the current URL
- the assertion described by `VERIFY`
- assertion-driven `PASS` or `FAIL`
- target hostname and current path

Important clicks also receive a short-lived element outline and click marker. The helper reinjects the overlay after navigation, and the functional project treats the same calls as no-ops.

## Video Evidence

The mobile Persona A journey and desktop preparedness journey are recorded separately. Expected friendly artifact names are:

```text
evidence/videos/persona-a.webm
evidence/videos/crisis-preparedness.webm
```

Per-test archival copies may also appear below `evidence/videos/persona-a/` and `evidence/videos/crisis/`. Actual output is generated only after a run. Video is normally stored as a CI artifact rather than committed to Git. The overlay makes the silent video understandable without narration.

## Screenshots

The evidence journeys capture named checkpoints under `evidence/screenshots/`, including landing, situation, roadmap, reason, local schools, local medical care, human support, consultation summary, crisis overview, municipality, resources, coverage note, data gap, and preparation checklist. Important safety assertions also capture successful cautionary UI.

Screenshots may include the overlay so the displayed criterion and verification remain attached to the visible page. A filename in the evidence matrix is not considered generated until its status is updated from `NOT RUN`.

## Traces

Evidence projects record trace on every run. Functional mode retains trace on failure. Open a downloaded trace with:

```bash
pnpm exec playwright show-trace path/to/trace.zip
```

## Target URLs and local configuration

The personal/user deployment and municipality/preparedness deployment are selected independently at runtime. Local defaults are:

- `BASE_URL`: user app, `http://localhost:3000`
- `MUNICIPALITY_URL`: municipality app root, `http://localhost:3001`

```bash
BASE_URL=http://localhost:3000 MUNICIPALITY_URL=http://localhost:3001 pnpm test
BASE_URL=http://localhost:3000 MUNICIPALITY_URL=http://localhost:3001 pnpm test:evidence
BASE_URL=https://user.example MUNICIPALITY_URL=https://municipality.example pnpm test:evidence
```

Personal journeys always open `BASE_URL`. Crisis and municipality journeys always open the municipality root at `MUNICIPALITY_URL`; they do not append `/crisis` to the user deployment. The suite checks both configured deployments and reports a clear error when either is unavailable. `TARGET_COMMIT` identifies the exact application SHA in evidence metadata and is required by the CI workflow.

## Local Setup

1. Start the StayBridge Tokyo application independently. Do not add it as a package dependency and do not copy or import its source into this repository.
2. Start the user app at `http://localhost:3000` and the municipality app at `http://localhost:3001`, or set `BASE_URL` and `MUNICIPALITY_URL` to their public roots.
3. Install this repository and Playwright Chromium.
4. Type-check, then run functional or evidence mode against the public URL.

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm typecheck
BASE_URL=http://localhost:3000 MUNICIPALITY_URL=http://localhost:3001 pnpm test
```

Routes, wording, and accessible names must be inspected from the running UI before selectors are changed. The suite does not invent missing pages or force a requirement to pass.

## CI dispatch

The `Acceptance Tests` workflow supports both manual dispatch and the `application-updated` repository-dispatch event. Manual runs provide:

- `user_url`: user deployment URL reachable from the GitHub-hosted runner
- `municipality_url`: municipality deployment root URL reachable from the GitHub-hosted runner
- `evidence_mode`: whether to run the evidence projects after the functional job completes
- `target_commit`: the exact 40-character application commit SHA under test

The application repository can trigger the same workflow with this payload:

```json
{
  "event_type": "application-updated",
  "client_payload": {
    "user_url": "https://user.example",
    "municipality_url": "https://municipality.example",
    "application_ref": "0123456789abcdef0123456789abcdef01234567",
    "evidence_mode": true
  }
}
```

The workflow maps `user_url` to `BASE_URL`, `municipality_url` to `MUNICIPALITY_URL`, and the manual `target_commit` or dispatch `application_ref` to `TARGET_COMMIT`. The preparation job rejects missing targets, non-HTTP(S) URLs, non-boolean evidence mode, and non-exact application SHAs. See [docs/dispatch.md](docs/dispatch.md) for the contract.

The functional job installs dependencies and Chromium, runs type-checking and functional tests, and uploads its HTML report/test results. When requested, the evidence job runs even if the functional job failed, so diagnostic video/trace evidence is still preserved while the functional failure remains visible in the workflow result. It runs the evidence tests and matrix generator, then uploads screenshots, videos, traces, metadata, reports, and test results as `staybridge-acceptance-evidence-<target application SHA>`.

## Reports

Open the local Playwright report with:

```bash
pnpm report
```

Evidence metadata records scenario, step, acceptance criteria, the page target URL, both configured deployment URLs, target commit, browser, viewport, result, and timestamp. The generated run manifest also records the user and municipality URLs as a `targetUrls` map. The generated evidence matrix links criteria to the available artifacts. Failure evidence includes screenshot, trace, video, and the assertion error where Playwright can capture them. For AC-30, the test grants clipboard permission for the configured user origin, activates the copy control, reads `navigator.clipboard.readText()`, and compares copied content with visible summary facts.

## Safety Verification

Safety checks ensure the UI does not infer a right to stay, refugee status, refugee-recognition probability, work permission, or school admission from limited answers. They also prevent nationality from becoming a risk score and prevent the preparedness view from exposing individual location information. These are observable-language safeguards, not legal opinions.

## Accessibility

The suite checks critical and serious axe findings on the landing, situation, roadmap, local-action, and preparedness views; keyboard access for primary controls; and mobile horizontal overflow. The current axe run reports serious color-contrast failures on Landing, Roadmap, Local Action, and Preparedness; Situation Check passed that scoped axe assertion. See [docs/product-gaps.md](docs/product-gaps.md). Automated tooling cannot establish complete accessibility or translation quality.

## Limitations

Playwright acceptance tests verify defined UX requirements and observable behavior. They do not guarantee legal correctness, the accuracy or completeness of administrative/open data, real service availability, accessibility as a whole, native-speaker translation quality, or an actual affected person's experience. External sites and source data can change after a run.

See [docs/limitations.md](docs/limitations.md) for the evidence boundary and the planned combination of automated acceptance, actual user testing, and open-data source verification.
