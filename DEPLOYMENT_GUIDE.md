# Deployment guide — ten-person invitation-only pilot

Prepared **2026-10-20**. **No public domain has been deployed. User approval is required before opening public listeners or configuring a live domain.**

## Recommended configuration

Use **one persistent Node 24 instance behind Caddy HTTPS**, with the supplied [Dockerfile](pilot/Dockerfile), [Compose file](pilot/deploy/compose.yaml) and [Caddyfile](pilot/deploy/Caddyfile). This matches the existing private filesystem, process-local sessions, provider pacing and snapshot handles. Do not add replicas or use an ephemeral serverless filesystem for this pilot. The application is invitation-only even though the landing page and health endpoint can be publicly reachable.

The [official Next.js self-hosting guide](https://nextjs.org/docs/app/guides/self-hosting) recommends a reverse proxy and describes runtime server-only environment variables. [Caddy's official proxy guide](https://caddyserver.com/docs/quick-starts/reverse-proxy) explains its HTTPS proxy configuration. No hosting subscription, public IP, DNS record or TLS certificate has been purchased/provisioned here. Runtime resource caps are starting settings, not load-test guarantees.

## Configuration and secrets

Copy [pilot/.env.production.example](pilot/.env.production.example) to ignored `pilot/.env.production` on the approved host. Keep it readable only by the operator, outside source control and backups intended for public distribution.

| Variable | Required configuration |
|---|---|
| `PILOT_DEPLOYMENT` | `public` on the approved public host; `staging` for local HTTP checks only. |
| `PILOT_REQUIRE_INVITE` | `1`. Public mode also enforces the gate even if this is misconfigured; readiness fails unless explicitly enabled. |
| `PILOT_PUBLIC_ORIGIN` | Exact approved HTTPS origin, without trailing slash, e.g. `https://<approved-host>`. This controls origin checking and Secure cookies. |
| `PILOT_SITE_ADDRESS` | Approved Caddy hostname. The template `.invalid` value is deliberately unusable. |
| `PILOT_TRUST_PROXY` | `1` only with the supplied proxy and no direct external access to Node. Caddy overwrites `X-Pilot-Client-IP`; arbitrary forwarded headers are not trusted. |
| `FEEDBACK_SECRET` | Stable random **64 hexadecimal characters**. Public readiness rejects placeholders/obviously low-diversity values. Never set a `NEXT_PUBLIC_` equivalent. |
| `PILOT_TESTER_CODES` | Exactly ten distinct random codes matching `LP-` plus **32 hexadecimal characters**. Issue privately, one per tester. Codes are access credentials, not wallet keys. |
| `PILOT_FEEDBACK_DIR` | `/app/private-data` in the container, backed by `pilot_data`. |
| `SOLANA_RPC_URL` | Documented HTTPS read-only RPC. The public default works subject to provider limits. Credentials remain server-only. |
| `JUPITER_API_KEY` | Optional server-only free developer key. Keyless requests remain paced at 2.1s; no subscription is required to begin. |
| `PILOT_HTTP_BIND`, `PILOT_HTTPS_BIND` | Defaults bind only to loopback. Change to approved public bindings **only after approval**. |

Generate a secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Generate each invitation with `node -e "console.log('LP-'+require('crypto').randomBytes(16).toString('hex'))"`. Run privately; never paste generated values into research reports, screenshots or logs. Do not rotate the secret casually: it signs sessions/receipts and derives pseudonymous identifiers. A planned rotation requires handling old consented data and deletion receipts.

## Validate before starting anything public

From `pilot/`:

```powershell
npm ci
npm test
npm run build
npm run audit:build
npm run test:e2e
# Configuration validation only; do not print expanded secrets.
docker compose --env-file .env.production -f deploy/compose.yaml config --quiet
```

The build prepares `.next/standalone/server.js` and browser assets. `npm run start` runs that same standalone artifact on **127.0.0.1**, normalizing the private data path before Next changes its working directory. The Docker runner uses the standalone artifact as an unprivileged user. Docker's build context excludes environment secrets, feedback, research evidence and tests.

For local staging, retain `PILOT_DEPLOYMENT=staging`, a loopback HTTP origin, invitation gate enabled and proxy trust disabled when accessing Node directly. Start `npm run start`; inspect `/api/health` for liveness and `/api/health?ready=1` for configuration/storage readiness. Readiness does **not** probe or guarantee upstream API health. Live smoke tests exercise upstreams separately, with usage consent off.

## Public launch steps — approval gate

**Do not execute these steps on a public domain until the user approves the reviewed configuration.** After approval and a successful isolated container/proxy rehearsal:

1. Use a Linux host with Docker/Compose and persistent disk. Build and test the image; record its image digest and pin the chosen Caddy image digest for the actual release. Moving base-image tags in the template are not a reproducibility guarantee.
2. Set the real origin/hostname and secure random credentials. Expose only Caddy's approved 80/443 ports; never publish Node port 3000. Restrict administrative access. Do not put a CDN or another proxy in front without revisiting trusted-client-IP handling.
3. Start the reviewed stack using `docker compose --env-file .env.production -f deploy/compose.yaml up --build -d`. This starts services and is therefore part of the approval-gated launch, not a completed action.
4. Confirm liveness and readiness through HTTPS, valid certificate, HTTPS redirect, HSTS, CSP, Secure/HttpOnly/SameSite cookies, invitation rejection and accepted session. Check that spoofed client-IP headers cannot bypass admission controls.
5. Rehearse a consented **test-only** usage record in an isolated staging volume, then restart the app and verify persistence/erasure. Verify a private backup restore. Do not count test activity as testers.
6. Run the read-only SOL/USDC smoke and a mobile browser check through the actual proxy. Verify that unavailable costs stay unavailable and neither response nor browser assets expose secrets.
7. Only then send the approved pilot link and individual codes. No recruitment messages are sent by this implementation.

## Operations, retention and rollback

- `/api/health`: cheap liveness. `/api/health?ready=1`: configuration and a cached writable-directory probe; no keys, invitation values, wallet information or upstream requests returned.
- Keep **one app instance**. Sessions expire after 24 hours and are also lost on restart; users re-enter their code. Snapshots expire after two minutes. Removing a code and restarting revokes its access. Rate windows reset on restart; this is not a distributed limiter.
- Per tester: six lookups and six comparisons/minute; login attempts eight/minute per trusted-client pseudonym; global 120 guarded requests/minute. Two expensive operations maximum; provider queues are capped at twelve. These are conservative pilot policies, not provider SLAs.
- Run `docker compose --env-file .env.production -f deploy/compose.yaml exec -T app node scripts/ops.mjs summary` for aggregate counts only. No public analytics/feedback listing endpoint exists.
- Schedule the same operator command with `purge` **daily** (host cron/systemd timer). Analytics expire 30 days after consent; feedback expires 30 days after submission. Expired usage is also removed when accessed. The daily purge is a required deployment operation, not an already-installed scheduler. Retain backups under the same consent/retention policy; erasure must cover operator backups too.
- The UI's sign-out control erases usage history. Feedback receipts delete the response and its linked feedback/payment-interest events. Other usage remains subject to its separate consent until erased/expired.
- Do not enable request-body/cookie logging. Caddy access logs are disabled. Operational error logs can contain connection metadata; Docker rotation limits each service to two 5MB log files. Restrict operator access and retention; raw IPs are not written into application analytics.
- On failures: close external access or stop the proxy, retain private data securely, roll back to the previously tested image, restore configuration and verify readiness before reopening. Never fix an upstream outage by switching to synthetic prices.

## Current deployment limitation

2026-10-23 reliability update: readiness now checks both feedback and historical-ledger directories, with distinct directory roots. Public configuration also requires `PILOT_LEDGER_DIR`; the prepared template/Compose set it to `/app/private-data/ledger` within the existing persistent volume. Directory writability is not proof of volume durability. `var` is excluded from Docker's build context. Aggregation IDs and sessions remain process-local; restart requires invitation renewal and fresh analysis. A separate two-process local rehearsal verifies partial-ledger/usage persistence and erasure, not container/TLS behavior. Do not deploy multiple replicas or an ephemeral serverless runtime with this state model.

Compose configuration validates, but the Docker Linux engine is unavailable on this workstation (`dockerDesktopLinuxEngine` named pipe missing). **The Linux image build, Caddy runtime/TLS, volume restart/restore and public-host checks have not been completed.** The standalone Node artifact can be tested locally; it does not eliminate these launch gates. No public service is claimed ready until those checks and user approval exist.
