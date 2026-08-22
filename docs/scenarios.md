# Scenarios

All people described here are synthetic personas. Scenario data is entered only through the public browser UI; it is not imported from the target application's fixtures or internal state.

## Persona A — Central journey

**Purpose:** prove that a visitor who cannot return as planned can move from uncertainty to a prioritized set of next actions, local resources, human support, and a fact-based consultation summary.

| Field | Value |
| --- | --- |
| Age | 34 |
| Nationality | Myanmar |
| Tokyo location | Kita |
| Visit purpose | Tourism |
| Original departure | Within 30 days |
| Return status | Difficult |
| Stay deadline | Unknown |
| Accommodation | Hotel / temporary |
| Child | Yes, age 6–11 |
| Japanese | Beginner |
| Needs | Stay, consultation, accommodation, education, medical, employment |

### A1 — Fast demo evidence journey

The full presentation/review scenario loads the public “demo situation” control and follows the application's visible navigation. Expected evidence steps are:

1. Landing — start as Persona A (`AC-01`).
2. Load the demo situation with a marked click.
3. Verify a prioritized roadmap (`AC-08`, `AC-13`) and capture `03-roadmap`.
4. Verify stay-status confirmation guidance (`AC-09`).
5. Open the reason and verify that it reflects the answers (`AC-14`, `AC-15`); capture `04-why`.
6. Verify an education action for the six-year-old child (`AC-10`).
7. Open local school information (`AC-17`, `AC-18`) and show the navigation transition.
8. Verify public/open-data provenance and a source (`AC-20`, `AC-21`); capture `05-local-schools`.
9. Verify local medical information (`AC-19`); capture `06-local-medical`.
10. Verify human handoff and an official service route (`AC-24`–`AC-26`); capture `07-human-support`.
11. Verify a fact-based consultation summary without invented political/persecution claims (`AC-27`–`AC-29`); capture `08-consultation-summary`. Verify copy separately (`AC-30`).

The target is a roughly one-to-two-minute silent video, but comprehension and stable assertions take precedence over a fixed duration.

### A2 — Full manual input

Start Situation Check and enter each value in the table above, one public control at a time (`AC-02`–`AC-07`). Capture `02-situation`, submit, then verify the same core roadmap outcome as A1. This path proves input capability independently of the demo loader.

### A3 — Safety assertions

Across the roadmap, education, employment, human-support, and summary views, assert the absence of guarantees about residence permission, refugee status/probability, work permission, school admission, and medical access (`AC-22`, `AC-23`, `SAFE-01`–`SAFE-06`). Positive caution or official-confirmation language is preferred evidence where present.

## Persona B — No child

**Situation:** equivalent return difficulty and short-term stay context, but `Child: No`.

**Expected:** the roadmap does not include an unnecessary child education action (`AC-11`). General information must not be mistaken for a personalized action; the assertion should target the personalized roadmap region.

## Persona C — Return possible

**Situation:** the visitor indicates that return remains possible.

**Expected:** the application does not produce an excessive crisis-oriented roadmap. The test records the visible outcome without inventing a specific alternative recommendation not present in the product.

## Persona D — Medical need

**Situation:** short-term visitor with a stated medical need.

**Expected:** the roadmap reaches local medical information (`AC-17`, `AC-19`) while avoiding a guarantee that a listed provider can accept or treat the person (`AC-23`).

## Persona E — Employment need

**Situation:** short-term visitor who selects employment as a need.

**Expected:** the first action is to confirm work eligibility with an official/human source, not direct job search and not an automatic judgment that work is permitted (`AC-12`, `SAFE-04`).

## Preparedness / crisis journey

The desktop evidence scenario opens the municipality deployment root (`MUNICIPALITY_URL`) and records a separate video. The municipality app owns the preparedness route; the user app is not expected to expose `/crisis`:

1. Open Preparedness View (`AC-31`).
2. Verify the Myanmar case (`AC-32`).
3. Verify foreign-population reference data (`AC-33`).
4. Verify municipality-level context (`AC-34`) and attempt the required municipality-detail navigation (`AC-35`).
5. Review local resources (`AC-36`, `AC-37`).
6. Verify Coverage Note and the short-term visitor limitation (`AC-38`, `AC-39`).
7. Verify Data Gap and all four required dimensions under the strict criterion (`AC-40`, `AC-41`).
8. Verify Preparation Checklist and that the experience does not end at population visualization (`AC-42`, `AC-43`).

The initial public observation found two divergences: Kita is displayed but cannot be opened as a distinct municipality detail, and the Data Gap content does not explicitly cover real demand. These remain `Known Gap` until the product changes or the acceptance requirement is deliberately revised.

## Accessibility and device coverage

- Mobile Persona A uses a 390 × 844 iPhone-class viewport and asserts no horizontal page overflow.
- Preparedness evidence uses a 1440 × 900 desktop viewport.
- Landing, Situation Check, Roadmap, Local Action, and Preparedness receive critical/serious axe checks.
- Primary CTAs, Situation Check controls, and important buttons receive keyboard-only checks.

Selectors follow role, label, visible text, then stable test ID. Exact accessible names and routes must be confirmed against the running target; structural CSS selectors and imagined copy are not scenario requirements.
