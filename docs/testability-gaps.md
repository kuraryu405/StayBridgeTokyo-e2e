# Testability Gaps

This log records barriers to black-box verification. It does not authorize changes to the StayBridge Tokyo repository. A product requirement that is visibly absent belongs in [product-gaps.md](product-gaps.md); a selector or observability problem belongs here.

## Open items

### TG-01 — Municipality detail has no observable transition

- **Related criterion:** AC-35
- **Observed public behavior:** `/crisis` shows a Kita City section and its resources in the same page, but initial inspection found no control or route that opens a distinct municipality detail.
- **Test impact:** a strict browser test cannot demonstrate the required “go to municipality detail” interaction. Presence of the words “Kita City” is insufficient and must not be used to force a pass.
- **Current handling:** report `Known Gap`. The current evidence flow captures the inline Kita section but does not implement the strict detail-navigation assertion; its AC-35 annotation must not be interpreted as `PASS`.
- **Possible target-side improvement:** expose a visible municipality choice/detail control or clarify that the inline section is the accepted detail behavior.

### TG-02 — External official-site outcomes are outside the target boundary

- **Related criteria:** AC-16, AC-21, AC-26
- **Constraint:** the suite can verify that a visible source/official-support link exists, has a plausible HTTP(S) destination, and initiates the intended navigation. The availability, content, or redirects of an external site can change independently.
- **Current handling:** assert the StayBridge-owned link and destination; record external content verification as a limitation rather than making acceptance depend on a third party.

### TG-03 — Clipboard verification depends on browser permission/context

- **Related criterion:** AC-30
- **Constraint:** reading the clipboard requires a supported secure/browser context and explicit permission. A visible copy control alone does not prove copied content.
- **Current handling:** the test derives the configured target origin, grants clipboard read/write permission for that origin, clicks the copy control, verifies the visible confirmation state, reads `navigator.clipboard.readText()`, and compares copied content with visible summary facts. A deployment that blocks clipboard APIs should be reported as an environment limitation, not silently reduced to a button-only assertion.

## Confirmed product issue, not a testability exception

The axe integration executed successfully and found serious `color-contrast` violations on Landing, Roadmap, Local Action, and Preparedness. Situation Check passed the scoped serious/critical scan. These are product accessibility failures recorded as PG-03 in [product-gaps.md](product-gaps.md), not scanner limitations and not candidates for suppression.

## Pending inspection

Stable accessible names, labels, landmarks, and focus behavior for the personal journey must be confirmed from the running public UI. Until that inspection and the first run complete, no missing `data-testid` or accessibility attribute is claimed here.

## Recording template

```text
TG-XX — Short title
Related AC:
Public steps:
Expected observable hook:
Actual observable hook:
Test impact:
Current workaround (if non-invasive):
Suggested target-side improvement:
```

Tests prefer role, label, text, and finally stable test ID. Fragile structural selectors, application source inspection, direct state manipulation, or edits to the target are not acceptable workarounds.
