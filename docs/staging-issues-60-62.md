# Issues #60 / #62 staging acceptance

This HTTP-only black-box spec needs a synthetic aggregate fixture already present in the municipality deployment. The `7d` / `return_status` response must be `available` with at least five respondents. It does not create D1 records. The normal assistant check explicitly declines conversation storage; API-error checks are browser route mocks for visible fallback states only.

Run it after the application staging workflow deploys both public URLs:

```bash
git clone --depth=1 https://github.com/kuraryu405/StayBridgeTokyo-e2e.git staybridge-e2e
cd staybridge-e2e
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium
BASE_URL="$STAGING_USER_URL" MUNICIPALITY_URL="$STAGING_MUNICIPALITY_URL" pnpm exec playwright test e2e/staging-issues-60-62.spec.ts --project=functional
```

The application workflow can run those commands after checking out this public repository. Set the URLs to deployed user and municipality roots; do not append `/crisis` to the user URL.

The assistant assertion avoids generated prose and instead verifies the rendered official source link, update date, fetch date, coverage/limitation text, and human-handoff controls.
