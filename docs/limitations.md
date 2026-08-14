# Limitations

## What automated acceptance establishes

The suite establishes whether a configured public deployment exhibits the defined observable behavior at a recorded time and viewport. It can connect a requirement to a browser action, deterministic assertion, screenshot, video, trace, and metadata.

The overlay communicates what the test is attempting to verify. Its text, including `PASS`, is not proof; the Playwright assertion and retained run result are authoritative.

## What it does not establish

- **Legal correctness:** wording and handoff checks do not establish immigration, refugee, employment, education, medical, privacy, or other legal compliance.
- **Administrative accuracy:** UI assertions do not fully validate that official information or administrative policy is current or correct.
- **Open-data accuracy/completeness:** the suite can verify displayed provenance and source links, not independently prove every source record or population figure.
- **Live service availability:** a listed school, clinic, counter, or facility may have changed hours, eligibility, capacity, appointments, or acceptance conditions after publication.
- **Complete accessibility:** axe checks cover detectable critical/serious rules only; keyboard tests and mobile overflow checks remain partial. Human assistive-technology review is required.
- **Translation quality:** presence and language switching do not establish accuracy, clarity, cultural appropriateness, or native-speaker quality.
- **Real user experience:** Personas A–E are synthetic. Their journeys do not substitute for research or testing with affected people.
- **External websites:** official and open-data destinations can change, redirect, fail, or alter content outside StayBridge's control.
- **All browser/device combinations:** the initial suite uses Chromium with a representative mobile and desktop viewport, not every engine, OS, device, font, or network condition.
- **Security and performance:** this acceptance suite is not a penetration test, privacy audit, load test, or performance benchmark.

## Known gaps versus limitations

A limitation is outside what this automated suite can guarantee. A Known Gap is a stated acceptance criterion that current observable product behavior does not meet. Known gaps must remain visible in the evidence matrix and product-gap log; limitations must not be used to relabel a deterministic product failure as passing.

## Human and data evidence

The intended evidence model can grow without conflating evidence types:

```text
evidence/
├── automated/  # Playwright assertions and artifacts
├── human/      # moderated usability, accessibility, translation review
└── data/       # source provenance and record-level verification
```

A mature assessment combines:

```text
Automated acceptance
+ Actual user testing
+ Open-data source verification
```

Each stream should retain its method, reviewer, target/version, timestamp, and result. No automated run should claim the authority of the other two streams.

## Review cadence

Evidence is a snapshot. Re-run after target deployments, route/content changes, source-data refreshes, or external-link changes. Record `BASE_URL`, timestamp, and `TARGET_COMMIT` when available so reviewers can distinguish product change from test change.
