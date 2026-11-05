import { z } from "zod";
import { apiError, body, PilotError, sameOrigin } from "../../../lib/http";
import { deleteFeedback, saveFeedback } from "../../../lib/feedback";
import { guard,track } from "../../../lib/guard";
export const runtime="nodejs";
export async function POST(request:Request){
  try{const session=guard(request,"feedback");const input=await body(request);const saved=await saveFeedback(input,session?.pid);
    await track(session,"feedback_submitted",saved.id);
    if(input.payIntent==="request-paid-pilot")await track(session,"willing_to_pay",saved.id);
    return Response.json(saved,{status:201,headers:{"Cache-Control":"no-store"}});}
  catch(e){return apiError(e);}
}
export async function DELETE(request:Request){
  try{guard(request,"delete");const parsed=z.object({receipt:z.string().max(64),deleteToken:z.string().max(64)}).strict().safeParse(await body(request));
    if(!parsed.success)throw new PilotError("Provide your feedback deletion receipt and token.");
    await deleteFeedback(parsed.data.receipt,parsed.data.deleteToken);return Response.json({deleted:true},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return apiError(e);}
}
