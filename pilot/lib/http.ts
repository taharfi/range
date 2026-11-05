export class PilotError extends Error {
  constructor(message: string, public status = 400, public code?: string) {super(message);}
}
type State = {next: Record<string, number>; tails: Record<string, Promise<unknown>>; pending: Record<string,number>};
const globals = globalThis as typeof globalThis & {pilotHttp?: State};
const state = globals.pilotHttp ??= {next: {}, tails: {}, pending:{}};
state.pending??={};

// One process-wide queue per provider. Conservative local policy, not a claimed provider SLA.
export async function paced<T>(name: string, interval: number, job: () => Promise<T>): Promise<T> {
  if((state.pending[name]||0)>=12)throw new PilotError("Provider queue is full. Try again shortly.",429);
  state.pending[name]=(state.pending[name]||0)+1;
  const run = (state.tails[name] ?? Promise.resolve()).catch(() => {}).then(async () => {
    const delay = Math.max(0, (state.next[name] ?? 0) - Date.now());
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    state.next[name] = Date.now() + interval;
    return job();
  });
  state.tails[name] = run.catch(() => {});
  try{return await run;}finally{state.pending[name]--;}
}
export async function limitedText(stream:ReadableStream<Uint8Array>|null,max:number,timeout=5000):Promise<string>{
  if(!stream)return "";
  const reader=stream.getReader(),chunks:Uint8Array[]=[];let bytes=0;
  let timer:ReturnType<typeof setTimeout>|undefined;
  const expiry=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{void reader.cancel().catch(()=>{});reject(new PilotError("Request body timed out.",408));},timeout);});
  try{
    for(;;){const {value,done}=await Promise.race([reader.read(),expiry]);if(done)break;bytes+=value.byteLength;
      if(bytes>max){void reader.cancel().catch(()=>{});throw new PilotError("Request is too large.",413);}chunks.push(value);}
    return Buffer.concat(chunks).toString("utf8");
  }finally{if(timer)clearTimeout(timer);reader.releaseLock();}
}
export async function jsonRead(url: string, init: RequestInit = {}): Promise<unknown> {
  let response: Response;
  try {response = await fetch(url, {...init, redirect:"error", cache: "no-store", signal: AbortSignal.timeout(18_000),
    headers: {"User-Agent": "LP-Exit-Intelligence-Pilot/0.1", ...init.headers}});}
  catch {throw new PilotError("Data provider did not respond. Try again shortly; no fallback prices were substituted.", 503);}
  if (!response.ok) throw new PilotError(`Data provider returned HTTP ${response.status}${response.status === 429 ? " (rate limited)" : ""}. Try again later.`, 503,response.status===429||response.status>=500?'UPSTREAM_TRANSIENT':'UPSTREAM_REJECTED');
  try {return JSON.parse(await limitedText(response.body,2_000_000,18_000));} catch {throw new PilotError("Data provider returned an unreadable or oversized response.", 502);}
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {if(process.env.PILOT_DEPLOYMENT==="public")throw new PilotError("A same-origin request is required.",403);return;}
  if(request.headers.get("sec-fetch-site")==="cross-site")throw new PilotError("Cross-origin submissions are not accepted.",403);
  // Next may normalize the internal request URL to localhost even when the browser uses
  // 127.0.0.1. Compare with the HTTP Host authority, not that internal hostname.
  const internal = new URL(request.url);
  const expected = process.env.PILOT_PUBLIC_ORIGIN
    ? new URL(process.env.PILOT_PUBLIC_ORIGIN).origin
    : new URL(`${internal.protocol}//${request.headers.get("host") || internal.host}`).origin;
  if (origin !== expected) throw new PilotError("Cross-origin submissions are not accepted.", 403);
}
export async function body(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 8192) throw new PilotError("Request is too large.", 413);
  const raw = await limitedText(request.body,8192);
  if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))throw new PilotError("Send an application/json request.",415);
  try {return JSON.parse(raw);} catch {throw new PilotError("Invalid JSON request.");}
}
export function apiError(error: unknown) {
  const message = error instanceof PilotError ? error.message : "The data could not be validated. Refresh or try another position.";
  const status=error instanceof PilotError ? error.status : 502;
  return Response.json({error: message,...(error instanceof PilotError && error.code ? {code:error.code}: {})}, {status, headers: {"Cache-Control": "no-store",...(status===429?{"Retry-After":"60"}:{})}});
}
