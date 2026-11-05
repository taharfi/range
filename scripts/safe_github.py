"""Fail-closed source snapshot checks and daily commits. Never prints secret values."""
import argparse
from datetime import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
GIT_DIR = ROOT / '.git'
CONTROL_FILES = ['.gitignore', '.gitleaksignore', '.gitleaks.toml', 'scripts/safe_github.py',
                 'scripts/daily-github.ps1', '.githooks/pre-commit', '.githooks/pre-push']
DENIED_PARTS = {'.git', '.env', '.env.local', '.env.production', 'node_modules', '.venv', '.next',
                '__pycache__', '.pilot-feedback', 'test-results', 'playwright-report', 'var', 'secrets'}
DENIED_EXTENSIONS = {'.pem', '.key', '.p12', '.pfx', '.log', '.har', '.duckdb', '.parquet', '.zip', '.exe', '.dll'}
MAX_BYTES = 10_000_000


def git(*args, check=True):
    result = subprocess.run(['git', '-C', str(ROOT), *args], capture_output=True, check=False)
    if check and result.returncode:
        raise RuntimeError('Git operation failed: ' + args[0] + ' (details withheld).')
    return result


def permitted(name):
    p = Path(name)
    if p.is_absolute() or '..' in p.parts or any(x in DENIED_PARTS for x in p.parts):
        return False
    if any(x.startswith('.env') and x not in {'.env.example', '.env.production.example'} for x in p.parts):
        return False
    if p.suffix.lower() in DENIED_EXTENSIONS or p.name in {'credentials.json', 'storageState.json'}:
        return False
    if p.parts[:1] == ('data',) and p.parts[:2] != ('data', 'evidence'):
        return False
    if p.parts[:1] == ('research',) and 'evidence' in p.parts:
        return False
    if name.startswith('pilot/evidence/'):
        allowed = {'positions-sample.json', 'jupiter-quote-sample.json', 'diagnostic-quote-0.json',
                   'terminal/activity-sample.json', 'terminal/closed-positions-sample.json',
                   'terminal/closed-pools-sample.json', 'token2022/mints.json',
                   'helius-history-2026-11-05/README.md', 'helius-history-2026-11-05/sync-summary.json',
                   'helius-history-2026-11-05/checkpoint.json', 'helius-history-2026-11-05/decoded-events.json'}
        return name.removeprefix('pilot/evidence/') in allowed
    return True


def local_secrets():
    values = []
    for file in [ROOT / '.env', ROOT / '.env.local', ROOT / 'pilot/.env.local', ROOT / 'pilot/.env.production']:
        if not file.is_file():
            continue
        for line in file.read_text(encoding='utf-8-sig').splitlines():
            if not line.strip() or line.lstrip().startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            value = value.strip().strip('\"\'')
            if re.search(r'SECRET|API_KEY|PASSWORD|TOKEN|TESTER_CODES|DEVELOPMENT_CODE', key):
                values.extend(v for v in value.split(',') if len(v) >= 4)
            if key.strip() == 'SOLANA_RPC_URL':
                from urllib.parse import urlparse, parse_qs
                values.extend(parse_qs(urlparse(value).query).get('api-key', []))
    return list(set(values))


def scanner():
    binary = os.environ.get('RANGE_GITLEAKS') or str(Path(os.environ.get('LOCALAPPDATA', '')) / 'RANGE/tools/gitleaks-8.30.1/gitleaks.exe')
    if not Path(binary).is_file():
        raise RuntimeError('Gitleaks scanner missing; publishing is blocked.')
    return binary


def run_scanner(binary, kind, target, report, extra=()):
    result = subprocess.run([binary, kind, str(target), '--redact', '--no-banner', '--no-color',
                             '--config', str(ROOT / '.gitleaks.toml'),
                             '--ignore-gitleaks-allow', '--report-format', 'json', '--report-path', str(report),
                             '--gitleaks-ignore-path', str(ROOT / '.gitleaksignore'), *extra], capture_output=True)
    if result.returncode:
        count = len(json.loads(report.read_text())) if report.exists() else 'unknown'
        raise RuntimeError(f'Secret scan blocked publishing ({count} findings). Redacted report stays in .git/range-security/.')


def audit():
    if git('rev-parse', '--show-toplevel').stdout.decode().strip().replace('\\', '/') != ROOT.as_posix():
        raise RuntimeError('Unexpected Git root.')
    security = GIT_DIR / 'range-security'
    security.mkdir(exist_ok=True)
    secrets = local_secrets()
    entries = git('ls-files', '--stage', '-z').stdout.split(b'\0')
    files = 0
    entries = [entry for entry in entries if entry]
    object_ids = [entry.split(b'\t', 1)[0].split()[1] for entry in entries]
    batch = subprocess.run(['git', '-C', str(ROOT), 'cat-file', '--batch'], input=b'\n'.join(object_ids)+b'\n', capture_output=True, check=True).stdout
    offset = 0
    local_config = GIT_DIR / 'range-daily.json'
    approved_binaries = json.loads(local_config.read_text()).get('binaryHashes', {}) if local_config.exists() else None
    with tempfile.TemporaryDirectory(prefix='range-public-scan-') as directory:
        for entry in entries:
            if not entry:
                continue
            meta, raw_name = entry.split(b'\t', 1)
            mode, oid, stage = meta.decode().split()
            name = raw_name.decode('utf-8')
            if stage != '0' or mode not in {'100644', '100755'} or not permitted(name):
                raise RuntimeError('Unsupported or private staged path blocked: ' + name)
            end = batch.index(b'\n', offset)
            header = batch[offset:end].split()
            if header[:2] != [oid.encode(), b'blob']:
                raise RuntimeError('Unexpected Git object; no snapshot published.')
            size = int(header[2]);payload = batch[end+1:end+1+size];offset = end+1+size+1
            if len(payload) > MAX_BYTES:
                raise RuntimeError('Oversized staged file blocked: ' + name)
            if b'\x00' in payload and approved_binaries is not None and approved_binaries.get(name) != hashlib.sha256(payload).hexdigest():
                raise RuntimeError('New or changed binary needs manual privacy review: ' + name)
            for value in secrets:
                raw = value.encode()
                matched = raw in payload if len(raw) >= 8 else re.search(rb'(?<![A-Za-z0-9_])' + re.escape(raw) + rb'(?![A-Za-z0-9_])', payload)
                if matched:
                    raise RuntimeError('Configured credential found in staged content: ' + name + ' (value withheld).')
            target = Path(directory) / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(payload)
            files += 1
        run_scanner(scanner(), 'dir', directory, security / 'staged.json')
    if git('rev-parse', '--verify', 'HEAD', check=False).returncode == 0:
        history = git('log', '-p', '--all', '--format=', '--no-ext-diff').stdout
        for value in secrets:
            raw = value.encode()
            if len(raw)>=8 and raw in history or len(raw)<8 and re.search(rb'(?<![A-Za-z0-9_])'+re.escape(raw)+rb'(?![A-Za-z0-9_])',history):
                raise RuntimeError('Configured credential found in commit history; publishing blocked (value withheld).')
        run_scanner(scanner(), 'git', ROOT, security / 'history.json', ('--log-opts=--all',))
    print(json.dumps({'stagedFilesScanned': files, 'configuredValuesChecked': len(secrets), 'result': 'passed'}))


def control_hashes():
    return {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in CONTROL_FILES}


def snapshot():
    config = json.loads((GIT_DIR / 'range-daily.json').read_text())
    if control_hashes() != config['controlHashes']:
        raise RuntimeError('Publishing safeguards changed; manual review required before daily push.')
    if git('branch', '--show-current').stdout.decode().strip() != 'main':
        raise RuntimeError('Daily publishing only operates on main.')
    if git('remote', 'get-url', 'origin').stdout.decode().strip() != config['remote']:
        raise RuntimeError('Remote changed; daily publishing blocked.')
    if git('diff', '--cached', '--quiet', check=False).returncode:
        raise RuntimeError('Existing staged work needs manual review; daily publishing stopped.')
    git('fetch', '--quiet', 'origin', 'main')
    if git('merge-base', '--is-ancestor', 'origin/main', 'HEAD', check=False).returncode:
        raise RuntimeError('Remote has divergent/new commits; resolve manually. No merge or force push attempted.')
    if git('status', '--porcelain', '-z', '--untracked-files=all').stdout:
        git('add', '-A')
        audit()
        if git('diff', '--cached', '--quiet', check=False).returncode:
            subprocess.run(['git', '-C', str(ROOT), 'commit', '-m', 'chore: RANGE progress checkpoint ' + datetime.now().strftime('%Y-%m-%d')], check=True)
    else:
        audit()
    if git('rev-parse', 'HEAD').stdout != git('rev-parse', 'origin/main').stdout:
        # Hooks rescan the full staged snapshot/history immediately before push.
        git('push', 'origin', 'main:main')
        print('Real progress pushed to GitHub.')
    else:
        print('No new changes; no empty commit created.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--snapshot', action='store_true')
    args = parser.parse_args()
    try:
        snapshot() if args.snapshot else audit()
    except Exception as exc:
        print('BLOCKED: ' + str(exc), file=sys.stderr)
        sys.exit(1)
