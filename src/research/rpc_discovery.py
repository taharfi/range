"""Read-only bounded public RPC proof of concept using the published DLMM IDL."""
import hashlib
import json
import time
from pathlib import Path

import httpx

from research.collector import atomic_json

PROGRAM = 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'
ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'


def b58decode(s):
    n = 0
    for c in s: n = n * 58 + ALPHABET.index(c)
    return b'\0' * (len(s)-len(s.lstrip('1'))) + (n.to_bytes((n.bit_length()+7)//8, 'big') if n else b'')


def b58encode(value):
    n = int.from_bytes(value, 'big'); result = ''
    while n:
        n, r = divmod(n,58); result = ALPHABET[r] + result
    return '1' * (len(value)-len(value.lstrip(b'\0'))) + result


def address_valid(value):
    try: return len(b58decode(value)) == 32
    except (ValueError, TypeError): return False


def decode_events(tx, idl):
    if not tx or not tx.get('meta') or tx['meta'].get('err') is not None: return []
    keys = tx['transaction']['message']['accountKeys']
    keys = [k['pubkey'] if isinstance(k,dict) else k for k in keys]
    loaded = tx['meta'].get('loadedAddresses', {})
    keys += loaded.get('writable', []) + loaded.get('readonly', [])
    types = {t['name']: t['type'] for t in idl['types']}
    supported = {bytes(e['discriminator']): e['name'] for e in idl['events'] if e['name'] in ['PositionCreate','PositionClose','AddLiquidity','RemoveLiquidity','ClaimFee','ClaimFee2','ClaimReward','ClaimReward2']}
    events = []
    for group in tx['meta'].get('innerInstructions') or []:
        for inner_index, ix in enumerate(group['instructions']):
            if ix.get('programIdIndex', len(keys)) >= len(keys) or keys[ix['programIdIndex']] != PROGRAM or 'data' not in ix: continue
            data = b58decode(ix['data'])
            # Anchor event-CPI instruction discriminator, followed by event discriminator.
            if data[:8] != bytes([228,69,165,46,81,203,154,29]): continue
            name = supported.get(data[8:16])
            if not name: continue
            offset = 16; values = {}
            for f in types[name]['fields']:
                t = f['type']
                if t == 'pubkey':
                    if len(data[offset:offset+32]) != 32: raise ValueError('Truncated pubkey')
                    values[f['name']] = b58encode(data[offset:offset+32]); offset += 32
                elif isinstance(t,dict) and 'array' in t:
                    base, count = t['array']; size = int(base[1:])//8
                    if len(data[offset:offset+size*count]) != size*count: raise ValueError('Truncated array')
                    values[f['name']] = [str(int.from_bytes(data[offset+i*size:offset+(i+1)*size], 'little')) for i in range(count)]; offset += size*count
                else:
                    size = int(t[1:])//8
                    if len(data[offset:offset+size]) != size: raise ValueError('Truncated integer')
                    values[f['name']] = str(int.from_bytes(data[offset:offset+size], 'little', signed=t.startswith('i'))); offset += size
            events.append({'event': name, 'outer_index': group['index'], 'inner_index': inner_index, 'slot': tx['slot'], 'block_time': tx.get('blockTime'), **values})
    return events


class RPC:
    def __init__(self, root, url='https://api.mainnet.solana.com', interval=2.1):
        self.root = Path(root); self.url = url; self.interval = interval; self.last = 0
        self.http = httpx.Client(timeout=40)

    def call(self, method, params):
        request = {'jsonrpc':'2.0','id':1,'method':method,'params':params}
        digest = hashlib.sha256(json.dumps(request,sort_keys=True).encode()).hexdigest()
        path = self.root/'rpc'/f'{digest}.json'
        if path.exists():
            payload = json.loads(path.read_text(encoding='utf-8'))
            if 'result' in payload: return payload['result']
        for attempt in range(3):
            time.sleep(max(0,self.interval-(time.monotonic()-self.last))); self.last=time.monotonic()
            r = self.http.post(self.url,json=request)
            atomic_json(path.with_suffix('.request.json'), request)
            path.parent.mkdir(parents=True,exist_ok=True); path.write_bytes(r.content)
            atomic_json(path.with_suffix('.meta.json'), {'status':r.status_code,'retrieved_at':time.time(),'endpoint':'public-mainnet','sha256':hashlib.sha256(r.content).hexdigest()})
            if r.status_code == 429 or r.status_code >= 500:
                if attempt < 2:
                    time.sleep(max(float(r.headers.get('Retry-After','10')),10)); continue
            r.raise_for_status(); payload=r.json()
            if 'error' in payload: raise RuntimeError(json.dumps(payload['error']))
            return payload['result']


def discover(root, max_transactions=120):
    root=Path(root); rpc=RPC(root); idl=json.loads(Path('data/evidence/dlmm-idl.json').read_text())
    result={'method':'finalized public RPC + IDL event-CPI decoding','transactions_requested':0,'transactions_available':0,'wallets':[], 'events':[], 'errors':[], 'complete_history':False}
    owners=set()
    try:
        signatures=rpc.call('getSignaturesForAddress',[PROGRAM,{'limit':max_transactions,'commitment':'finalized'}])
        atomic_json(root/'signature_sample.json',signatures)
        for item in signatures:
            if item['err'] is not None: continue
            result['transactions_requested']+=1
            try:
                config={'encoding':'json','maxSupportedTransactionVersion':0,'commitment':'finalized'}
                try:
                    tx=rpc.call('getTransaction',[item['signature'],config])
                except RuntimeError as exc:
                    # Current RPC explicitly requests version 1 for newer transactions.
                    if '-32015' not in str(exc) or 'version (1)' not in str(exc): raise
                    config['maxSupportedTransactionVersion']=1
                    tx=rpc.call('getTransaction',[item['signature'],config])
                if tx: result['transactions_available']+=1
                for event in decode_events(tx,idl):
                    event['signature']=item['signature']; result['events'].append(event)
                    # Only explicit owner fields establish LP ownership. Sender/fee payer do not.
                    if event.get('owner'): owners.add(event['owner'])
            except Exception as exc:
                result['errors'].append({'signature':item['signature'],'error':str(exc)})
                if len(result['errors']) >= 3: break
            result['wallets']=sorted(owners); atomic_json(root/'wallet_discovery.json',result)
            if len(owners)>=20: break
    except Exception as exc: result['errors'].append({'error':str(exc)})
    finally: rpc.http.close()
    result['wallets']=sorted(owners); atomic_json(root/'wallet_discovery.json',result)
    return result


if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser(); p.add_argument('--output',type=Path,default=Path('data/phase2')); p.add_argument('--max-transactions',type=int,default=120)
    a=p.parse_args(); r=discover(a.output,a.max_transactions); print(json.dumps({k:v for k,v in r.items() if k not in ['events','wallets']},indent=2)); print('wallets',len(r['wallets']),'events',len(r['events']))
