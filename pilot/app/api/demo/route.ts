import { demoBrief } from "../../../lib/demo";
import { guard } from "../../../lib/guard";
import { apiError } from "../../../lib/http";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{guard(request,"demo");return Response.json(await demoBrief(),{headers:{"Cache-Control":"no-store"}});}catch(e){return apiError(e);}}
