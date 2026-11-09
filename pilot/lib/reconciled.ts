import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {z} from 'zod';
import {address} from './meteora';
import {ledgerDirectory} from './storage';
import {PilotError} from './http';
import {D} from './math';
const key=z.string().transform(address),atomic=z.string().regex(/^\d+$/),units=z.string().regex(/^\d+(\.\d+)?$/);
const signature=z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{64,88}$/);
const total=z.object({deposit:units,withdrawal:units,fee:units,depositAtomic:atomic,withdrawalAtomic:atomic,feeAtomic:atomic});
const check=z.object({signature,slot:z.number().int().safe(),at:z.number().int(),feeLamports:atomic,feePayer:key,sides:z.array(z.object({side:z.enum(['x','y']),depositAtomic:atomic,withdrawalAndFeeAtomic:atomic,reserveInAtomic:atomic,reserveOutAtomic:atomic,balanceDeltaAtomic:z.string().nullable(),matches:z.boolean()})).length(2)});
const token=z.object({mint:key,symbol:z.string().min(1).max(100),decimals:z.number().int().min(0).max(18)});
const event=z.object({signature,slot:z.number().int().safe().nonnegative(),at:z.number().int().positive(),type:z.string().max(64),outerIndex:z.number().int().nonnegative(),innerIndex:z.number().int().nonnegative()});
const reportSchema=z.object({version:z.literal(1),position:key,owner:key,pool:key,quality:z.enum(['token-flow-reconciled','unverified']),tokens:z.object({x:token,y:token}),verifiedAt:z.string().datetime(),source:z.string().max(200),createdAt:z.number().int().positive().nullable(),closedAt:z.number().int().positive().nullable(),closureConfirmed:z.boolean(),signatureSetMatched:z.boolean(),queryExhausted:z.boolean(),issues:z.array(z.string().max(200)).max(50),transactionCount:z.number().int().min(1).max(100),rawEventCount:z.number().int().nonnegative(),aliasPairsSuppressed:z.number().int().nonnegative(),totals:z.object({x:total,y:total}),transactions:z.array(check).min(1).max(100),events:z.array(event).max(100),observedTransactionFeesLamports:atomic,costAllocationComplete:z.literal(false),historicalUsdPnl:z.null(),holdBenchmarkUsd:z.null(),coverage:z.string().max(300)}).superRefine((v,ctx)=>{if(v.quality==='token-flow-reconciled'&&(!v.closureConfirmed||!v.signatureSetMatched||!v.queryExhausted||v.issues.length||!v.createdAt||!v.closedAt||v.createdAt>v.closedAt))ctx.addIssue({code:'custom',message:'Inconsistent reconciliation gates'});
 for(const side of ['x','y'] as const)for(const kind of ['deposit','withdrawal','fee'] as const){if(!new D(v.totals[side][kind]).mul(new D(10).pow(v.tokens[side].decimals)).eq(v.totals[side][`${kind}Atomic`]))ctx.addIssue({code:'custom',message:'Inconsistent atomic units'});}
 if(v.quality==='token-flow-reconciled'&&(v.transactions.length!==v.transactionCount||new Set(v.transactions.map(t=>t.signature)).size!==v.transactionCount||v.transactions.some(t=>t.sides.some(s=>!s.matches))))ctx.addIssue({code:'custom',message:'Incomplete transfer checks'});
 if(v.quality==='token-flow-reconciled'){
  const observed=v.transactions.reduce((sum,t)=>sum.plus(t.feeLamports),new D(0));if(!observed.eq(v.observedTransactionFeesLamports))ctx.addIssue({code:'custom',message:'Transaction fee sum mismatch'});
  for(const side of ['x','y'] as const){let deposits=new D(0),outgoing=new D(0);for(const t of v.transactions){if(new Set(t.sides.map(s=>s.side)).size!==2)ctx.addIssue({code:'custom',message:'Missing transfer side'});const s=t.sides.find(s=>s.side===side);if(!s)continue;deposits=deposits.plus(s.depositAtomic);outgoing=outgoing.plus(s.withdrawalAndFeeAtomic);if(!new D(s.depositAtomic).eq(s.reserveInAtomic)||!new D(s.withdrawalAndFeeAtomic).eq(s.reserveOutAtomic)||s.balanceDeltaAtomic===null||!new D(s.balanceDeltaAtomic).eq(new D(s.depositAtomic).minus(s.withdrawalAndFeeAtomic)))ctx.addIssue({code:'custom',message:'Transfer/balance reconciliation mismatch'});}
   if(!deposits.eq(v.totals[side].depositAtomic)||!outgoing.eq(new D(v.totals[side].withdrawalAtomic).plus(v.totals[side].feeAtomic)))ctx.addIssue({code:'custom',message:'Cash-flow sum mismatch'});
  }
 }
}).transform(({transactions,...publicReport})=>publicReport);
export type ReconciledPosition=z.infer<typeof reportSchema>;
export type ReconciledPage={positions:ReconciledPosition[];coverage:'saved-operator-evidence-only';status:'available'|'not-indexed'};
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
async function json(file:string){const bytes=await readFile(file,'utf8');if(Buffer.byteLength(bytes)>512000)throw Error('Evidence exceeds bounded size');return JSON.parse(bytes);}
export async function savedReconciliation(wallet:string,directory=join(ledgerDirectory(),'reconciled')):Promise<ReconciledPage>{
 const owner=address(wallet);let manifest:unknown;
 try{manifest=await json(join(directory,'wallet-'+hash(owner)+'.json'));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {positions:[],coverage:'saved-operator-evidence-only',status:'not-indexed'};throw new PilotError('Saved lifecycle evidence could not be read. No empty history was inferred.',503);}
 try{const index=z.object({owner:key,positions:z.array(key).min(1).max(5)}).parse(manifest);if(index.owner!==owner||new Set(index.positions).size!==index.positions.length)throw Error('Manifest mismatch');
  const positions:ReconciledPosition[]=[];for(const position of index.positions){const report=reportSchema.parse(await json(join(directory,hash(position)+'.json')));if(report.owner!==owner||report.position!==position)throw Error('Evidence identity mismatch');positions.push(report);}
  return {positions,coverage:'saved-operator-evidence-only',status:'available'};
 }catch{throw new PilotError('Saved lifecycle evidence failed validation. No verified accounting was inferred.',503);}
}
