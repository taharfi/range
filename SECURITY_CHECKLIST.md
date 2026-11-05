# Security checklist — LP Exit Intelligence

As of **2026-10-20**. This is an implementation review, not a penetration-test certification. Public launch remains gated by runtime validation and user approval.

## Implemented application controls

- [x] Read-only provider allowlist: documented Meteora GETs, Solana `getAccountInfo`, Jupiter quote-only GET without taker/payer/signature. No signing/execution endpoints, custody, seed phrases or private-key inputs.
- [x] Browser input is only a public address and scenario settings. Quotes use server-held inventories/decimals; unsupported mints and stale snapshots fail closed.
- [x] Public mode requires an invited session for live lookups/quotes. Sessions use signed, opaque, HttpOnly, SameSite=Strict cookies; Secure is added for the canonical HTTPS origin. Invitation codes are never stored in usage records or URLs.
- [x] Origin checks use a configured canonical origin in deployment. Public mutations reject missing/cross-site origins. Access-cookie logout revokes process-local sessions for that participant.
- [x] Per-participant and global request limits; finite provider queues and concurrent expensive work; 429 responses include `Retry-After`.
- [x] Request bodies streamed with an 8KB limit; JSON-only payloads; body deadline; strict schemas. Provider responses are size/time bounded and redirects are rejected.
- [x] Secrets remain server-only; no `NEXT_PUBLIC_` key configuration. Production template has placeholders that fail readiness. Build audit scans browser assets for configured private values without printing them.
- [x] No automatic synthetic fallback. Example mode is explicit and excluded from measured comparisons/feedback.
- [x] Full execution costs are marked unavailable. Fees/rewards are separated from principal; quote fees are not deducted twice; no historical USD profitability claim or recommended “best action.”
- [x] Optional usage consent is unchecked by default and separate from feedback consent. Declining it still permits invited use. Structured event metadata excludes wallets, mints, amounts, raw IPs and free text.
- [x] Feedback free text is rejected by the server. No contact/payment information or unnecessary wallet identity is requested.
- [x] Usage deletion, feedback deletion, event deduplication and expiry/purge tooling exist. Private records and runtime secrets are excluded from source control and the Docker build context.
- [x] CSP limits browser connections to same origin; frame embedding/object loading are blocked; referrer leakage is disabled. Next hydration currently needs inline scripts/styles, so the policy includes `unsafe-inline`; no claim of a strict nonce CSP is made.
- [x] Docker runner is non-root, drops capabilities, has no direct published app port, uses a private persistent volume and bounded logs. Caddy overwrites its trusted-client header.

## Required release checks — not completed by writing configuration

- [ ] User approves the concrete public deployment and domain.
- [ ] Linux Docker image builds and runs; record/pin release image digests.
- [ ] Actual proxy HTTPS certificate, redirect, HSTS, Secure cookie and canonical-origin behavior verified.
- [ ] Direct access to Node is blocked; no extra CDN/proxy weakens trusted-IP handling.
- [ ] Private volume survives restart; backup/restore tested with isolated records; permissions verified on the actual host.
- [ ] Daily expiry purge and backup-retention procedure scheduled and verified.
- [ ] Genuine secure production secret and ten random production-format codes configured; no local/test codes reused.
- [ ] Readiness and live read-only SOL/USDC checks pass through the deployed proxy; mobile and consent/deletion checked there.

## Residual limits

The limiter/session/cache design requires one instance and does not replace network-level denial-of-service controls. A leaked invitation can be abused until revoked; codes are not proof of LP ownership. No system can prevent a user typing a secret into an arbitrary address field, but the client rejects non-address strings, the server does not persist lookup bodies, and the app never requests secrets. Operator error logs/backups need access and retention controls. Docker/TLS runtime validation is blocked by the unavailable local engine; see [deployment guide](DEPLOYMENT_GUIDE.md).
