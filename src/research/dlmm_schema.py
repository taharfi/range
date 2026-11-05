"""IDL-driven Borsh event decoding and verified fixed account prefix parsing."""
import base64
import json
from pathlib import Path

from research.rpc_discovery import PROGRAM, b58decode, b58encode

EVENT_CPI=bytes([228,69,165,46,81,203,154,29])


class Codec:
    def __init__(self, idl=None):
        self.idl=idl or json.loads(Path('data/evidence/dlmm-idl.json').read_text())
        self.types={t['name']:t['type'] for t in self.idl['types']}
        self.events={bytes(e['discriminator']):e['name'] for e in self.idl['events']}

    def read(self,data,offset,t):
        def take(size):
            value=data[offset:offset+size]
            if len(value)!=size: raise ValueError('Truncated IDL value')
            return value,offset+size
        if t=='pubkey':
            v,end=take(32);return b58encode(v),end
        if t=='bool':
            v,end=take(1)
            if v[0] not in (0,1):raise ValueError('Invalid bool')
            return bool(v[0]),end
        if isinstance(t,str) and t[0] in 'ui' and t[1:].isdigit():
            v,end=take(int(t[1:])//8);return int.from_bytes(v,'little',signed=t[0]=='i'),end
        if isinstance(t,dict):
            if 'defined' in t:
                n=t['defined'];n=n['name'] if isinstance(n,dict) else n
                return self.read(data,offset,self.types[n])
            if 'array' in t:
                item,count=t['array'];values=[]
                for _ in range(count):
                    value,offset=self.read(data,offset,item);values.append(value)
                return values,offset
            if t.get('kind')=='struct':
                values={}
                for field in t['fields']:values[field['name']],offset=self.read(data,offset,field['type'])
                return values,offset
        raise ValueError(f'Unsupported IDL field {t}')

    def pool_prefix(self,account):
        if account['owner']!=PROGRAM:raise ValueError('Not DLMM-owned')
        data=base64.b64decode(account['data'][0]); disc=bytes(next(x['discriminator'] for x in self.idl['accounts'] if x['name']=='LbPair'))
        if data[:8]!=disc:raise ValueError('Not LbPair')
        offset=8;fields={}
        # Prefix fields have explicit padding in the verified repr(C) IDL.
        for field in self.types['LbPair']['fields']:
            fields[field['name']],offset=self.read(data,offset,field['type'])
            if field['name']=='protocol_fee':break
        return fields


def account_keys(tx):
    keys=[k['pubkey'] if isinstance(k,dict) else k for k in tx['transaction']['message']['accountKeys']]
    loaded=(tx.get('meta') or {}).get('loadedAddresses',{})
    return keys+loaded.get('writable',[])+loaded.get('readonly',[])


def decode_all(tx,codec):
    if not tx or not tx.get('meta') or tx['meta'].get('err') is not None:return []
    keys=account_keys(tx);events=[]
    for group in tx['meta'].get('innerInstructions') or []:
        for index,ix in enumerate(group['instructions']):
            if ix.get('programIdIndex',len(keys))>=len(keys) or keys[ix['programIdIndex']]!=PROGRAM or 'data' not in ix:continue
            data=b58decode(ix['data'])
            if data[:8]!=EVENT_CPI:continue
            name=codec.events.get(data[8:16]); row={'signature':tx['transaction']['signatures'][0],'slot':tx['slot'],'block_time':tx.get('blockTime'),'outer_index':group['index'],'inner_index':index,'event':name or 'UNKNOWN_EVENT','raw_hex':data.hex()}
            try:
                if not name:raise ValueError('Unknown event discriminator')
                row['fields'],offset=codec.read(data,16,codec.types[name])
                if offset!=len(data):raise ValueError(f'Trailing event bytes {len(data)-offset}')
            except ValueError as exc:row['decode_error']=str(exc)
            events.append(row)
    return events
