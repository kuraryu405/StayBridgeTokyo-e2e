# Product Gaps

These are issue candidates discovered through the public interface. They are not modified or hidden by the acceptance repository. No screenshot or trace is claimed until an automated evidence run produces it.

## PG-01 — Municipality detail cannot be opened

- **Acceptance criterion:** AC-35
- **Severity:** Major
- **Status:** Known Gap (publicly observed; strict detail-navigation assertion pending)
- **Steps:**
  1. Open the public Preparedness View at the municipality deployment root.
  2. Locate the municipality context for Kita City.
  3. Attempt to open or navigate to municipality detail.
- **Expected:** a user can go to the selected municipality's detail view.
- **Actual:** Kita City and resource information are rendered inline as a fixed section; no distinct detail interaction or navigation was observed.
- **Evidence:** `evidence/screenshots/crisis/02-municipality.png`, crisis video, and trace capture the inline section, but do not prove the missing navigation.
- **Acceptance handling:** keep AC-35 as `Known Gap`. Do not equate label visibility, screenshot capture, metadata annotation, or the non-strict evidence flow with a pass.

## PG-02 — Data Gap does not explicitly describe real demand

- **Acceptance criterion:** AC-41
- **Severity:** Major
- **Status:** Known Gap (publicly observed; strict four-dimension assertion pending)
- **Steps:**
  1. Open the municipality deployment root.
  2. Read “今のOpen Dataでは分からないこと”.
  3. Compare the visible gap dimensions with the strict AC-41 dimensions.
- **Expected:** explicit coverage of short-term visitor visibility, language support, consultation capacity, and real demand.
- **Actual:** the page visibly covers short-term visitor distribution, facility/counter capacity or availability, language, and real-time availability. It does not explicitly identify actual/real demand as a gap.
- **Evidence:** `evidence/screenshots/crisis/05-data-gap.png`, crisis video, and trace capture the section, but do not supply the missing concept.
- **Acceptance handling:** keep strict AC-41 as `Known Gap`. Do not reinterpret real-time availability as real demand, and do not treat screenshot/metadata generation as a pass.

## PG-03 — Serious color-contrast failures across four primary views

- **Quality requirement:** no serious or critical axe violations on Landing, Situation Check, Roadmap, Local Action, and Crisis.
- **Severity:** Major (`axe` impact: serious)
- **Status:** Confirmed FAIL in the current automated axe run
- **Expected:** foreground/background contrast meets the axe/WCAG 2 AA threshold for the evaluated text.
- **Actual:**
  - Landing roadmap-preview step numbers: 1.58:1 (`#c4d0ce` on `#ffffff`; expected 4.5:1).
  - Roadmap action numbers: 2.49:1 (`#8aa0a5` on `#f0f5f3`), and review chips: 4.26:1 (`#62757e` on `#eef2f1`; expected 4.5:1).
  - Local Action location pill: 4.19:1 (`#62757e` on `#e9f1ef`), and resource definition labels: 2.96:1 (`#87999d` on `#ffffff`; expected 4.5:1).
  - Preparedness brand “Tokyo”: 2.39:1 (`#126b86` on `#102d36`), with intro/section copy at 4.37:1 (`#62757e` on `#f2f5f2`; expected 4.5:1).
- **Unaffected scoped check:** Situation Check produced no serious/critical axe violation in this run.
- **Evidence:** failure metadata and screenshots under `evidence/metadata/failures/` and `evidence/screenshots/safety-accessibility.spec.ts/`, plus the Playwright HTML report.
- **Acceptance handling:** retain the failures. Do not exclude `color-contrast` or downgrade the serious-impact filter to obtain a pass.

## Issue template

```text
PG-XX — Short title
AC / SAFE ID:
Severity:
Target and timestamp:
Public steps:
Expected:
Actual:
Screenshot:
Trace:
Notes / human review needed:
```
