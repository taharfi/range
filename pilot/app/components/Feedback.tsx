"use client";
import { useState } from "react";
import type { Brief } from "../../lib/models";
type Receipt={id:string;receipt:string;deleteToken:string};
async function post<T>(path:string,data:unknown):Promise<T>{const r=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data),signal:AbortSignal.timeout(90000)});const v=await r.json();if(!r.ok)throw new Error(v.error||"Feedback was not saved.");return v;}
function download(name:string,value:unknown){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
export function Feedback({brief,authenticated}:{brief:Brief;authenticated:boolean}){
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[receipt,setReceipt]=useState<Receipt|null>(null),[deleted,setDeleted]=useState(false);
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");const f=new FormData(e.currentTarget);
    try{setReceipt(await post<Receipt>("/api/feedback",{consent:f.get("consent")==="on",testerCode:String(f.get("testerCode")||""),token:brief.feedbackToken,selfReportedLp:f.get("selfReportedLp")==="on",
      ...Object.fromEntries(["understood","withdrawalCostsIncluded","usefulInsight","overlookedCosts","intendedBefore","intendedAfter","useAgain","payIntent","comment"].map(k=>[k,String(f.get(k)||"")])),monthlyAmount:Number(f.get("monthlyAmount")||0)}));}
    catch(e){setError(e instanceof Error?e.message:"Feedback was not saved.");}finally{setBusy(false);}
  }
  async function remove(){if(!receipt)return;setBusy(true);setError("");try{const r=await fetch("/api/feedback",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({receipt:receipt.receipt,deleteToken:receipt.deleteToken})});const v=await r.json();if(!r.ok)throw new Error(v.error);setDeleted(true);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  const choices=[{value:"yes",label:"Yes"},{value:"no",label:"No"},{value:"unsure",label:"Not sure"}];
  function select(name:string,label:string,options=choices){return <label>{label}<select name={name} required defaultValue=""><option value="" disabled>Choose an answer</option>{options.map(o=><option value={o.value} key={o.value}>{o.label}</option>)}</select></label>;}
  const actions=[{value:"hold",label:"Hold"},{value:"rebalance",label:"Rebalance"},{value:"exit",label:"Exit"},{value:"undecided",label:"Undecided"}];
  return <section className="feedback-section" aria-labelledby="feedback-title"><div><h2 id="feedback-title">Did this make your decision clearer?</h2><p className="muted">Optional. Tell us whether this comparison helped.</p></div>
    {brief.mode==="demo"?<p className="notice">Example mode is excluded from tester results. Generate a live brief to submit pilot feedback.</p>:!brief.feedbackToken?<p className="notice">Feedback storage is not configured. The facilitator must configure a storage secret and invitation codes. Nothing is being recorded.</p>:deleted?<p className="notice" role="status">Your feedback has been deleted.</p>:receipt?<div className="notice" role="status"><strong>Feedback saved with your consent.</strong><p>Keep your deletion receipt. This page does not save it in your browser.</p><button className="secondary" onClick={()=>download("feedback-deletion-receipt.json",receipt)}>Download deletion receipt</button> <button className="text-button" disabled={busy} onClick={remove}>Delete my feedback now</button>{error&&<p role="alert">{error}</p>}</div>:<form onSubmit={submit} className="feedback-form">
      {!authenticated&&<label>Tester invitation code<input name="testerCode" required minLength={6} maxLength={80} autoComplete="off" placeholder="From your pilot facilitator"/></label>}
      <label className="checkbox"><input name="selfReportedLp" type="checkbox" required/>I currently provide, or have recently provided, Meteora DLMM liquidity.</label>
      <div className="feedback-grid">
        {select("understood","Could you understand the comparison?",[{value:"yes",label:"Yes"},{value:"partly",label:"Partly"},{value:"no",label:"No"}])}
        {select("withdrawalCostsIncluded","Does the quoted minimum include Meteora withdrawal costs?")}
        {select("usefulInsight","Did you find a useful new insight?")}
        {select("overlookedCosts","Did it reveal costs you had overlooked?")}
        {select("intendedBefore","What did you intend before this brief?",actions)}
        {select("intendedAfter","What do you intend after this brief?",actions)}
        {select("useAgain","Would you use this again?")}
        {select("payIntent","Would you pay for a continued pilot?",[{value:"no",label:"No"},{value:"maybe",label:"Maybe"},{value:"request-paid-pilot",label:"I want to discuss a priced pilot"}])}
      </div>
      <label>Monthly amount you would consider (USD; optional)<input name="monthlyAmount" type="number" min="0" max="10000" step="1" placeholder="A research signal, not a payment"/></label>
      <p className="footnote">This form records structured answers only. Share qualitative feedback with your facilitator without submitting wallet addresses or private information here.</p>
      <label className="checkbox consent"><input name="consent" type="checkbox" required/>I consent to storing these answers under a pseudonymous tester identifier for this pilot. My wallet/position address is not attached. I can delete my response using its receipt. Facilitator verification is separate; this is not a payment commitment.</label>
      {error&&<p className="error" role="alert">{error}</p>}
      <button disabled={busy} className="primary">{busy?"Saving…":"Save feedback with consent"}</button>
    </form>}
  </section>;
}
