"""Capture only public research documents. Does not touch the financial pipeline."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
from urllib.request import Request, urlopen
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/opportunity_validation/public_sources'
SOURCES = {
    'lpagent_fee': 'https://docs.lpagent.io/fee.md',
    'lpagent_methodology': 'https://docs.lpagent.io/data-methodology.md',
    'hawk_risks': 'https://hawkfi.gitbook.io/whitepaper/guides-and-support/understand-fees-and-risks.md',
    'hawk_backtest': 'https://hawkfi.gitbook.io/whitepaper/hawkfi-laboratory/liquidity-providing.md',
    'hawk_terminal': 'https://hawkfi.gitbook.io/whitepaper/advance-guide/hawkfi-agent-terminal.md',
    'revert_performance': 'https://docs.revert.finance/revert/position-analytics/how-revert-measures-performance.md',
    'revert_compounder': 'https://docs.revert.finance/revert/auto-compounder.md',
    'revert_backtest': 'https://docs.revert.finance/revert/playbooks/backtest-before-funding.md',
    'meteora_terminal': 'https://raw.githubusercontent.com/MeteoraAg/docs/main/user-guides/how-to-use-dlmm/dynamic-terminal.mdx',
    'tidepool_docs': 'https://tidepool.ag/docs',
    'tidepool_terms': 'https://tidepool.ag/terms',
    'poolparty_guide': 'https://lppool.party/guide/profile',
    'kamino_docs': 'https://kamino.com/docs/llms.txt',
    'dlmm_simulator': 'https://dlmmsim.xyz',
    'profit_analysis': 'https://geeklad.github.io/meteora-profit-analysis/',
    'krystal': 'https://krystal.app/',
    'defituna_fees': 'https://docs.defituna.com/dive-into-defituna/provide-liquidity/platform-info/fees',
    'orca': 'https://www.orca.so/compliance-disclosure',
    'jupiter_swap': 'https://developers.jup.ag/docs/swap',
    'jupiter_trigger': 'https://developers.jup.ag/docs/trigger',
    'jupiter_grants_end': 'https://discuss.jup.ag/t/grants-program-post-mortem/38973.json',
    'meteora_hackathon': 'https://superteam.fun/earn/listing/meteora-dbc',
    'colosseum_hackathon': 'https://colosseum.com/hackathon',
    'colosseum_eternal': 'https://colosseum.com/eternal',
}

class Readable(HTMLParser):
    def __init__(self):
        super().__init__(); self.skip = 0; self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'): self.skip += 1
    def handle_endtag(self, tag):
        if tag in ('script', 'style') and self.skip: self.skip -= 1
        if tag in ('p', 'div', 'li', 'h1', 'h2', 'h3', 'tr'): self.parts.append('\n')
    def handle_data(self, data):
        if not self.skip: self.parts.append(data)

def capture(item):
    key, url = item
    meta = {'url': url, 'checked_as_of': '2026-10-20', 'access': 'public unauthenticated HTTP GET'}
    try:
        with urlopen(Request(url, headers={'User-Agent': 'Research-document-review/1.0'}), timeout=40) as r:
            raw = r.read(); meta.update(status=r.status, final_url=r.url, content_type=r.headers.get('Content-Type'))
        OUT.joinpath(key + '.raw').write_bytes(raw)
        meta.update(bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest())
        content = raw.decode('utf-8', errors='replace')
        if '<html' in content[:1000].lower() or '<!doctype' in content[:100].lower():
            parser = Readable(); parser.feed(content)
            content = '\n'.join(x.strip() for x in ''.join(parser.parts).splitlines() if x.strip())
        OUT.joinpath(key + '.txt').write_text(content, encoding='utf-8')
        print(key, meta['status'], len(raw), flush=True)
    except Exception as exc:
        meta['error'] = str(exc); print(key, str(exc), flush=True)
    OUT.joinpath(key + '.meta.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
    return meta

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(capture, SOURCES.items()))
    OUT.joinpath('manifest.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
