import {z} from 'zod';
import {guard,expensive} from '../../../lib/guard';
import {body,apiError,PilotError} from '../../../lib/http';
import {closedPositions,positionActivity,type ClosedPage,type ActivityPage} from '../../../lib/terminal';
import {syncPositionLedger} from '../../../lib/ledger';
import {savedReconciliation,type ReconciledPage} from '../../../lib/reconciled';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const schema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('closed'),address:z.string().max(44),page:z.number().int().min(1).max(10000).optional(),pool:z.string().max(44).optional()}).strict(),
 z.object({kind:z.literal('history'),position:z.string().max(44),pool:z.string().max(44)}).strict(),
 z.object({kind:z.literal('reconciliation'),address:z.string().max(44)}).strict()
]);
export async function POST(request:Request){try{
 guard(request,'lookup');const parsed=schema.safeParse(await body(request));if(!parsed.success)throw new PilotError('Enter a valid portfolio request.');
 const v=parsed.data;const result=await expensive<ClosedPage|ActivityPage|ReconciledPage>(()=>v.kind==='closed'?closedPositions(v.address,v.page,v.pool):v.kind==='reconciliation'?savedReconciliation(v.address):syncPositionLedger(v.position,v.pool));
 return Response.json(result,{headers:{'Cache-Control':'no-store'}});
}catch(e){return apiError(e);}}
