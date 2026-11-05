import { readiness } from "../../../lib/readiness";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
  if(new URL(request.url).searchParams.get("ready")!=="1")return Response.json({status:"ok",readOnly:true},{headers:{"Cache-Control":"no-store"}});
  try{const checks=await readiness(),ready=Object.values(checks).every(Boolean);
    return Response.json({status:ready?"ready":"not-ready",checks,upstream:"not probed"},{status:ready?200:503,headers:{"Cache-Control":"no-store"}});
  }catch{return Response.json({status:"not-ready"},{status:503});}
}
