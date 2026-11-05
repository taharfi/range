import { z } from "zod";
import { apiError, body, PilotError } from "../../../lib/http";
import { guard } from "../../../lib/guard";
import { closeSession, invitationRequired, openSession, sessionFor } from "../../../lib/session";
import { feedbackConfigured } from "../../../lib/feedback";
import { recordUsage } from "../../../lib/analytics";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store"};
export async function GET(request:Request){
  try{guard(request,"status");const s=sessionFor(request);
    if(s?.consent)await recordUsage(s.pid,"visit",new Date().toISOString().slice(0,10));
    return Response.json({required:invitationRequired(),authenticated:!!s,analyticsConsent:s?.consent||false,feedbackAvailable:feedbackConfigured()},{headers});
  }catch(e){return apiError(e);}
}
export async function POST(request:Request){
  try{guard(request,"session");const v=z.object({code:z.string().trim().min(1).max(80),analyticsConsent:z.boolean()}).strict().safeParse(await body(request));
    if(!v.success)throw new PilotError("Enter your invitation code and choose whether to allow usage measurement.");
    const result=await openSession(v.data.code,v.data.analyticsConsent);
    return Response.json({required:invitationRequired(),authenticated:true,analyticsConsent:result.session.consent},{headers:{...headers,"Set-Cookie":result.cookie}});
  }catch(e){return apiError(e);}
}
export async function DELETE(request:Request){
  try{guard(request,"session");const cookie=await closeSession(sessionFor(request));return Response.json({signedOut:true,analyticsErased:true},{headers:{...headers,"Set-Cookie":cookie}});}
  catch(e){return apiError(e);}
}
