import { z } from "zod";
import { apiError, body, PilotError, sameOrigin } from "../../../lib/http";
import { getSnapshot, address } from "../../../lib/meteora";
import { buildBrief } from "../../../lib/brief";
import { guard,expensive,track } from "../../../lib/guard";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema=z.object({handle:z.string().uuid(),exitMint:z.string().max(44),targetXPercent:z.number().min(0).max(100),slippageBps:z.number().int().min(1).max(500)}).strict();
export async function POST(request:Request){
  try{const session=guard(request,"brief");const parsed=schema.safeParse(await body(request));if(!parsed.success)throw new PilotError("Check the asset, composition and slippage settings.");
    const v=parsed.data;address(v.exitMint);
    const result=await expensive(()=>buildBrief(getSnapshot(v.handle),v.exitMint,v.targetXPercent,v.slippageBps));
    const completed=result.exit.status!=="unavailable"&&result.rebalance.status!=="unavailable";
    const analyticsRecorded=await track(session,completed?"comparison_completed":"comparison_incomplete",result.id);
    return Response.json({...result,analyticsRecorded},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return apiError(e);}
}
