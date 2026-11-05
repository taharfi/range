import {aggregatePage} from '../../../../lib/aggregation';
import {guard,track} from '../../../../lib/guard';
import {invitationRequired,sessionFor} from '../../../../lib/session';
import {apiError,PilotError} from '../../../../lib/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){try{const session=guard(request,'status');if(invitationRequired()&&!sessionFor(request))throw new PilotError('Renew your pilot invitation to retrieve portfolio data.',401);
 const url=new URL(request.url),id=url.searchParams.get('id')||'',cursor=url.searchParams.get('cursor')||undefined;if(!/^[a-f0-9-]{36}$/.test(id)||cursor&&!/^[a-f0-9-]{36}$/.test(cursor))throw new PilotError('Invalid portfolio snapshot or cursor.');
 const result=aggregatePage(id,cursor);if(result.aggregate.status==='ready'&&result.aggregate.discovered>0)await track(session,'lookup_success',id);
 return Response.json(result,{headers:{'Cache-Control':'no-store'}});
}catch(e){return apiError(e);}}
