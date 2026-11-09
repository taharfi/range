# GitHub progress checkpoints

The public source repository is `https://github.com/taharfi/range`. The initial snapshot contains RANGE application/research code, authored reports, placeholder environment templates, reviewed public test fixtures and the three generated social graphics. Publication does not deploy the app.

## What stays local

Real environment files and API keys; pilot invitations, feedback, analytics and runtime ledgers; browser traces and arbitrary screenshots; build artifacts, dependencies, databases, Parquet archives, bulk raw data, downloaded competitor bundles/source and operational reports are excluded. Existing local files are retained, not deleted. Some research reports intentionally refer to retained local evidence that is not included in this public source snapshot.

Checked-in environment templates contain placeholders only. The Git commit identity uses GitHub's no-reply address rather than the local personal email. The local pilot code is not published: its previous reuse in a unit-test fixture was replaced with an explicitly synthetic value, preserving the actual local setting.

## Daily behavior

The installed Windows Task Scheduler job is `RANGE Daily GitHub Progress`, daily at **20:00 Casablanca time**, using the signed-in Windows user's existing GitHub credentials. It runs `scripts/daily-github.ps1` with a hidden window and without storing a password, token or API key in the task definition. It needs the computer running, user signed in, network access, the existing `.venv` Python executable, Git, GitHub authentication and the local Gitleaks executable. Missed runs can start when the scheduler next permits; there is no cloud access to unpushed local work.

It stages actual changes allowed by the exclusions, audits the full staged snapshot and Git history, creates a dated progress commit if content changed, and pushes `main` without force. Empty days produce no fabricated commits. It refuses to operate on other branches, divergent remotes or pre-existing staged work. Changes to publishing controls or new/changed binary assets require manual review. A stopped task does not imply that publishing succeeded; inspect its result/log.

The Git hooks perform the same scan before commit/push. Use the existing Python environment:

```powershell
.venv/Scripts/python.exe scripts/safe_github.py
.venv/Scripts/python.exe scripts/test_safe_github.py
```

Gitleaks 8.30.1 was downloaded from its official release and the archive SHA-256 verified against GitHub's published release digest. The binary remains outside the repository under the user's local application-data directory. Checks include Gitleaks default rules, a Helius-URL rule and exact locally configured credential values. Only nine reviewed public mint/pool address literals in protocol JSON fields are excepted from generic-key false positives; no entire fixture/test directory is exempted.

Publishing controls and reviewed binary hashes are recorded locally in `.git/range-daily.json`. Redacted security reports and the latest scheduled-run log are kept in `.git/range-security/`, never uploaded. Missing scanner/configuration, secret findings, unknown binary changes or changed safeguards block the job. Fix and review findings; do not bypass the hooks to make a push pass.

To pause scheduled pushes:

```powershell
Disable-ScheduledTask -TaskName 'RANGE Daily GitHub Progress'
```

These safeguards reduce accidental exposure; they are not a guarantee that arbitrary future code/data can never contain sensitive information. Public commits are persistent, and binary assets require human privacy review. Daily checkpoints record progress, not test/deployment certification or evidence of real LP adoption.

Verified 2026-11-09: an actual scheduled no-change run returned exit code 0 and created no empty commit. The reviewed safeguards now disable interactive authentication and bound Git/scanner durations. Logs identify safe run stages without printing credentials.
