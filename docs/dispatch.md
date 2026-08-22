# Acceptance dispatch contract

The acceptance workflow is the receiving side of the application deployment E2E contract. It accepts either a manual `workflow_dispatch` or a `repository_dispatch` with event type `application-updated`.

## Normalized environment

Every functional and evidence job receives:

| Variable | Meaning | Local default |
| --- | --- | --- |
| `BASE_URL` | User/personal deployment root | `http://localhost:3000` |
| `MUNICIPALITY_URL` | Municipality/preparedness deployment root | `http://localhost:3001` |
| `TARGET_COMMIT` | Exact 40-character application SHA under test | none in local runs |

Personal journeys use `BASE_URL`. Crisis and municipality journeys use `MUNICIPALITY_URL` directly at its root. No crisis path is appended to the user URL.

## Manual dispatch

The current GitHub Actions form takes `user_url`, `municipality_url`, `evidence_mode`, and `target_commit`. The target commit must be the full application SHA, not the acceptance repository SHA, a branch name, or a short SHA.

The previous `base_url` input remains accepted for manual runs. It maps to `user_url` and to the legacy `/crisis` municipality path. If the old form omits `target_commit`, the receiver run SHA is used only as a compatibility label; new runs should always pass the application SHA.

## Repository dispatch

The application repository sends:

```json
{
  "event_type": "application-updated",
  "client_payload": {
    "user_url": "https://user.example",
    "municipality_url": "https://municipality.example",
    "application_ref": "0123456789abcdef0123456789abcdef01234567",
    "evidence_mode": false
  }
}
```

The receiver maps `client_payload.user_url` to `BASE_URL`, `client_payload.municipality_url` to `MUNICIPALITY_URL`, `client_payload.application_ref` to `TARGET_COMMIT`, and `client_payload.evidence_mode` to the evidence-job switch. A preparation job validates all four values before any browser job starts. The evidence job remains diagnostic and runs after functional failure when evidence mode is enabled.

The previous payload shape (`url` and `ref`, without `evidence_mode`) remains accepted. It maps `url` to the user deployment, `${url}/crisis` to the legacy municipality route, `ref` to `TARGET_COMMIT`, and defaults evidence mode to `false`.
