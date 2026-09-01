# Acceptance Criteria

This catalog is the normative mapping from requirement IDs to black-box browser checks. “Planned” evidence is a destination, not proof that an artifact exists; run status lives in [evidence-matrix.md](evidence-matrix.md). Assertions use only public, observable UI.

Priority meanings:

- **P0**: core product value, safety boundary, or required evidence journey
- **P1**: important breadth, negative persona, or supporting quality check

## Personal journey: AC-01–AC-30

| ID | Description | Persona | Automation | Planned evidence | Priority |
| --- | --- | --- | --- | --- | --- |
| AC-01 | Landing view is displayed. | A | Persona A full journey and smoke | `persona-a/01-landing.png`; Persona A video/trace | P0 |
| AC-02 | Situation Check can be started. | A | Full manual input | `persona-a/02-situation.png`; trace | P0 |
| AC-03 | Tourism can be entered as visit purpose. | A | Full manual input | Situation metadata/trace | P0 |
| AC-04 | Original departure within 30 days can be entered. | A | Full manual input | Situation metadata/trace | P0 |
| AC-05 | Difficult return status can be entered. | A | Full manual input | Situation metadata/trace | P0 |
| AC-06 | Hotel or equivalent temporary accommodation can be entered. | A | Full manual input | Situation metadata/trace | P0 |
| AC-07 | A child aged 6–11 can be entered. | A | Full manual input | Situation metadata/trace | P0 |
| AC-08 | Situation Check generates a roadmap. | A | Fast demo and full manual input | `persona-a/03-roadmap.png`; Persona A video/trace | P0 |
| AC-09 | Persona A receives an action to confirm stay/residence status. | A | Roadmap assertion | Roadmap screenshot/video/trace | P0 |
| AC-10 | Persona A receives an education action for the six-year-old child. | A | Roadmap assertion | Roadmap or education screenshot/video/trace | P0 |
| AC-11 | A no-child persona does not receive an unnecessary education action. | B | Negative persona test | Failure artifacts; metadata | P1 |
| AC-12 | An employment need does not send a short-term visitor directly to job search. | E | Employment safety scenario | Safety screenshot/video/trace | P0 |
| AC-13 | Actions are organized into periods such as TODAY, THIS WEEK, and NEXT 30 DAYS. | A | Roadmap assertion | `persona-a/03-roadmap.png`; Persona A video/trace | P0 |
| AC-14 | A reason (“why”) is available for primary actions. | A | Full journey reason interaction | `persona-a/04-why.png`; Persona A video/trace | P0 |
| AC-15 | The education reason reflects the stated child situation. | A | Reason-content assertion | `persona-a/04-why.png`; trace | P0 |
| AC-16 | The UI provides a route to official source information. | A | Link presence/href assertion | Roadmap/local screenshot and trace | P0 |
| AC-17 | Local Action can be reached. | A, D | Full journey navigation assertion | Local screenshot/video/trace | P0 |
| AC-18 | Local school information is displayed. | A | Full journey school assertion | `persona-a/05-local-schools.png`; Persona A video/trace | P0 |
| AC-19 | Local medical-provider information is displayed. | A, D | Full journey and medical persona | `persona-a/06-local-medical.png`; Persona A video/trace | P0 |
| AC-20 | The UI identifies public/open-data provenance. | A | Local source assertion | Local screenshots/video/trace | P0 |
| AC-21 | A data source is displayed. | A | Local source label/link assertion | Local screenshots/video/trace | P0 |
| AC-22 | The UI does not guarantee school admission. | A | Education safety language assertion | Education/safety screenshot and trace | P0 |
| AC-23 | The UI does not unjustifiably guarantee medical access or eligibility. | A, D | Medical safety language assertion | Medical/safety screenshot and trace | P0 |
| AC-24 | Human Support can be reached. | A | Full journey navigation assertion | `persona-a/07-human-support.png`; video/trace | P0 |
| AC-25 | Individual residence/status judgment is handed off to a human or official authority. | A | Human-support content assertion | Human-support screenshot/video/trace | P0 |
| AC-26 | A route to an official service such as FRESC is shown. | A | Official-link label/href assertion | Human-support screenshot/video/trace | P0 |
| AC-27 | Consultation Summary is displayed. | A | Full journey summary assertion | `persona-a/08-consultation-summary.png`; video/trace | P0 |
| AC-28 | Persona inputs, including child presence and age, are reflected in the summary. | A | Summary fact assertions, including `子どもがいる · 年齢: 6-11` | `persona-a/08-consultation-summary.png`; video/trace | P0 |
| AC-29 | The summary does not invent unstated political or persecution information. | A | Negative text assertion | Summary screenshot/video/trace | P0 |
| AC-30 | The consultation summary can be copied. | A | Dynamic-origin clipboard permission, copy confirmation, and clipboard readback comparison | Summary trace/metadata | P1 |

## Preparedness journey: AC-31–AC-43

| ID | Description | Persona/view | Automation | Planned evidence | Priority |
| --- | --- | --- | --- | --- | --- |
| AC-31 | Preparedness View can be reached. | Admin | Crisis full journey | `crisis/01-crisis-overview.png`; crisis video/trace | P0 |
| AC-32 | The Myanmar case is identifiable. | Admin | Crisis content assertion | Crisis overview screenshot/video/trace | P0 |
| AC-33 | Foreign-population reference data is displayed. | Admin | Population assertion | Crisis overview screenshot/video/trace | P0 |
| AC-34 | A municipality-level view is displayed. | Admin | Municipality label/data assertion | `crisis/02-municipality.png`; crisis video/trace | P0 |
| AC-35 | A municipality detail such as Kita can be opened/navigated to. | Admin | Known gap; no release-blocking assertion until the route exists | Municipality screenshot/video/trace | P0 |
| AC-36 | Local resources can be reviewed. | Admin | Resource list/category assertion | `crisis/03-resources.png`; crisis video/trace | P0 |
| AC-37 | Population alone is not used to conclude that support is insufficient. | Admin | Caution-language and prohibited-conclusion assertion | Overview/resources screenshot and trace | P0 |
| AC-38 | A Coverage Note is displayed. | Admin | Coverage-note assertion | `crisis/04-coverage-note.png`; crisis video/trace | P0 |
| AC-39 | The note states that short-term visitors are not fully represented in resident statistics. | Admin | Coverage text assertion | Coverage-note screenshot/video/trace | P0 |
| AC-40 | A Data Gap section is displayed. | Admin | Data-gap heading/content assertion | `crisis/05-data-gap.png`; crisis video/trace | P0 |
| AC-41 | Data gaps cover short-term visitor visibility, language support, consultation capacity, and real demand. | Admin | Strict four-dimension content assertion | Data-gap screenshot/video/trace | P0 |
| AC-42 | A Preparation Checklist / response-consideration list is displayed. | Admin | Checklist assertion | `crisis/06-preparation-checklist.png`; crisis video/trace | P0 |
| AC-43 | The admin experience continues beyond population visualization into resources, coverage, gaps, and preparation. | Admin | End-to-end section-order/presence assertions | Crisis video/trace and checkpoint screenshots | P0 |

## Safety: SAFE-01–SAFE-07

| ID | Description | Persona/view | Automation | Planned evidence | Priority |
| --- | --- | --- | --- | --- | --- |
| SAFE-01 | Return difficulty alone is not presented as permission to stay in Japan. | A | Prohibited-claim plus official-handoff assertion | Stay-safety screenshot/trace | P0 |
| SAFE-02 | Myanmar nationality alone is not treated as refugee status. | A | Prohibited-claim assertion | Nationality-safety screenshot/trace | P0 |
| SAFE-03 | No refugee-recognition probability is displayed. | A | Prohibited probability/claim assertion | Nationality-safety screenshot/trace | P0 |
| SAFE-04 | A short-term visitor is not automatically judged eligible to work. | E | Employment safety scenario | Employment-safety screenshot/trace | P0 |
| SAFE-05 | Having a child is not presented as guaranteed school admission. | A | Education safety language assertion | Education-safety screenshot/trace | P0 |
| SAFE-06 | Nationality is not displayed as a danger/risk score. | A, Admin | Prohibited risk-label assertion | Nationality/admin screenshot/trace | P0 |
| SAFE-07 | The admin view does not display an individual's location information. | Admin | Absence of person-level fields/markers assertion | Crisis screenshots/trace | P0 |

## Supporting quality checks

Accessibility checks cover critical/serious axe findings on Landing, Situation Check, Roadmap, Local Action, and Crisis; keyboard operation of CTAs and key controls; and mobile horizontal overflow. These checks support the criteria above but do not introduce additional AC IDs.
