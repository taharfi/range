"""Offline tests for publishing safeguards; no GitHub writes or real secrets."""
import importlib.util
from pathlib import Path
import tempfile
import json
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('safe_github', Path(__file__).with_name('safe_github.py'))
safe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(safe)


class PublishingSafeguards(unittest.TestCase):
    def test_changed_controls_stop_before_any_git_operation(self):
        with tempfile.TemporaryDirectory() as folder:
            directory=Path(folder)
            (directory/'range-daily.json').write_text(json.dumps({'controlHashes':{'test':'old'}}))
            with patch.object(safe,'GIT_DIR',directory), patch.object(safe,'control_hashes',return_value={'test':'new'}), patch.object(safe,'git') as git:
                with self.assertRaisesRegex(RuntimeError,'safeguards changed'):
                    safe.snapshot()
                git.assert_not_called()

    def test_git_operations_have_a_timeout_and_disable_interactive_auth(self):
        with patch.object(safe.subprocess,'run') as run:
            run.return_value.returncode=0
            safe.git('fetch','origin','main')
            self.assertEqual(run.call_args.kwargs['timeout'],120)
        self.assertEqual(safe.os.environ['GIT_TERMINAL_PROMPT'],'0')
        self.assertEqual(safe.os.environ['GCM_INTERACTIVE'],'Never')

    def test_private_runtime_and_unreviewed_evidence_are_denied(self):
        for name in ['pilot/.env.local', '.env', 'pilot/.env.production', 'pilot/var/ledger/a.json',
                     'pilot/.pilot-feedback/a.json', 'pilot/test-results/a.json', 'pilot/node_modules/a.js',
                     'research/a/evidence/vendor/source.js', 'data/phase5/rpc/a.json', 'key.pem',
                     'pilot/evidence/pilot-sequence/operator-summary.json', '../escape', '.git/config']:
            with self.subTest(name=name):
                self.assertFalse(safe.permitted(name))

    def test_source_placeholders_and_exact_public_fixtures_are_allowed(self):
        for name in ['pilot/.env.example', 'pilot/.env.production.example', 'pilot/lib/aggregation.ts',
                     'pilot/evidence/positions-sample.json', 'data/evidence/dlmm-idl.json', 'README.md']:
            self.assertTrue(safe.permitted(name))

    def test_missing_secret_scanner_blocks_publishing(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch.dict('os.environ', {'RANGE_GITLEAKS': str(Path(folder)/'missing.exe')}):
                with self.assertRaisesRegex(RuntimeError, 'missing'):
                    safe.scanner()

    def test_configured_values_are_read_locally_without_becoming_a_report(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root/'pilot').mkdir()
            synthetic = 'SYNTHETIC-UNIT-ONLY-DO-NOT-USE'
            (root/'pilot/.env.local').write_text('JUPITER_API_KEY='+synthetic+'\nPILOT_TESTER_CODES=UNIT-CODE-A,UNIT-CODE-B\nSOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key='+synthetic)
            with patch.object(safe, 'ROOT', root):
                values = safe.local_secrets()
            self.assertEqual(set(values), {synthetic, 'UNIT-CODE-A', 'UNIT-CODE-B'})


if __name__ == '__main__':
    unittest.main()
