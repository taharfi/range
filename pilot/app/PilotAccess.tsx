"use client";
import { useEffect,useState } from "react";
export type Access={required:boolean;authenticated:boolean;analyticsConsent:boolean;checking:boolean};
export function PilotAccess({onChange}:{onChange:(v:Access)=>void}){
  const [state,setState]=useState<Access>({required:false,authenticated:false,analyticsConsent:false,checking:true});
  const [code,setCode]=useState(""),[consent,setConsent]=useState(false),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  function update(v:Omit<Access,"checking">){const next={...v,checking:false};setState(next);onChange(next);}
  useEffect(()=>{let active=true;fetch("/api/session",{cache:"no-store"}).then(async r=>{const v=await r.json();if(!r.ok)throw new Error(v.error||"Pilot access is temporarily unavailable.");if(active)update(v);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
  async function login(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{
    const r=await fetch("/api/session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,analyticsConsent:consent})});const v=await r.json();if(!r.ok)throw new Error(v.error);update(v);setCode("");
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function logout(){setBusy(true);setError("");try{const r=await fetch("/api/session",{method:"DELETE"});const v=await r.json();if(!r.ok)throw new Error(v.error);update({required:state.required,authenticated:false,analyticsConsent:false});}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  const form=<form onSubmit={login} className="access-form"><label>Pilot access code<input type="password" value={code} onChange={e=>setCode(e.target.value)} autoComplete="one-time-code" minLength={1} maxLength={80} required placeholder="Your facilitator's invitation code"/></label>
    <label className="checkbox"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>Optional: measure my pilot usage under a tester identifier. This records visits, successful lookups, completed comparisons and feedback/payment-interest counts for up to 30 days. No wallet addresses, token amounts, IP addresses or advertising trackers are stored in these analytics. I can use the tool without this consent.</label>
    <button className="primary" disabled={busy}>{busy?"Opening pilot…":"Start private pilot"}</button><p className="footnote">A necessary HttpOnly access cookie lasts up to 24 hours. Feedback storage requires separate consent. Signing out erases usage history; feedback uses its separate deletion receipt.</p></form>;
  return <section className="access-panel" aria-label="Pilot access">{state.authenticated?<div className="section-heading"><div><strong>Private pilot access active</strong><p className="muted">Usage measurement {state.analyticsConsent?"enabled by consent":"off"}. Feedback is always optional.</p></div><button className="secondary" disabled={busy} onClick={logout}>Sign out & delete usage history</button></div>:state.required?<><h2>Welcome to the ten-person pilot</h2><p className="muted">Use your invitation code. No wallet connection or payment is needed.</p>{form}</>:state.checking?<p role="status">Checking pilot access…</p>:<details><summary>Have a tester invitation? Start an optional measured session</summary>{form}</details>}
    {error&&<p className="error" role="alert">{error} {state.checking&&<button className="text-button" onClick={()=>window.location.reload()}>Retry access check</button>}</p>}
  </section>;
}
