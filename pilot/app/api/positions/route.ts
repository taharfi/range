import { z } from "zod";
import { apiError, body, PilotError, sameOrigin } from "../../../lib/http";
import { lookup } from "../../../lib/meteora";
import {priceLookup} from '../../../lib/position-pricing';
import { guard,expensive,track } from "../../../lib/guard";
import {startAggregation,aggregatePage} from '../../../lib/aggregation';
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema=z.object({kind:z.enum(["wallet","position"]),address:z.string().max(44),page:z.number().int().min(1).max(100).optional(),pool:z.string().max(44).optional(),refresh:z.boolean().optional()}).strict();
export async function POST(request:Request) {
  try {const session=guard(request,"lookup");const parsed=schema.safeParse(await body(request));if(!parsed.success)throw new PilotError("Enter one valid public address and lookup type.");
    const result=parsed.data.kind==='wallet'&&!parsed.data.pool&&!parsed.data.page
      ?await expensive(async()=>{const job=startAggregation(parsed.data.address,parsed.data.refresh??false);return aggregatePage(job.id);})
      :await expensive(async()=>priceLookup(await lookup(parsed.data)));
    const analyticsRecorded=result.positions.length>0?await track(session,"lookup_success",result.snapshotId):false;
    return Response.json({...result,analyticsRecorded},{headers:{"Cache-Control":"no-store"}});
  } catch(e){return apiError(e);}
}
