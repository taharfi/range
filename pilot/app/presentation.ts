import { D } from "../lib/math";
import type { Position } from "../lib/models";

// Display only: financial calculations and API quantities retain their existing precision.
// Round down, including displayed minimums, so a shorter label never promises extra tokens.
export function amount(value:string|null|undefined,places=3){
  if(value===null||value===undefined)return "Unavailable";
  try{const n=new D(value);if(!n.isFinite()||n.isNegative())return "Unavailable";
    if(!n.isZero()&&n.lt(new D(10).pow(-places)))return n.toSignificantDigits(3,D.ROUND_DOWN).toString();
    const [whole,fraction]=n.toDecimalPlaces(places,D.ROUND_DOWN).toFixed().split(".");
    return whole.replace(/\B(?=(\d{3})+(?!\d))/g,",")+(fraction?"."+fraction:"");
  }catch{return "Unavailable";}
}
export function positionState(status:Position["rangeStatus"]){
  if(status==="in-range")return {title:"Your liquidity is inside its active price range.",detail:"It can participate in swaps while the price stays in range. Fees and future returns are not guaranteed."};
  if(status==="out-of-range")return {title:"Your liquidity is outside its active price range.",detail:"It may stop earning swap fees until the price moves back into range. Your token exposure remains."};
  return {title:"We cannot confirm your current range status.",detail:"Some pool data is unavailable. Refresh the position before relying on the comparison."};
}
export function rangePrecision(values:string[]){
  const numbers=values.map(v=>new D(v));
  const distinct=new Set(numbers.map(v=>v.toString())).size;
  let precision=4;
  while(precision<80&&new Set(numbers.map(v=>v.toSignificantDigits(precision).toString())).size<distinct)precision++;
  return precision;
}
export function qualityNotes(warnings:string[]){return [...new Set(warnings.map(w=>
  /sub.atomic|rounded down/i.test(w)?"Indexed balances include tiny rounded-down amounts; they are conservative estimates.":
  /mint owner|decimals.*checked|unsupported token program/i.test(w)?"Some token information could not be verified. Conversion quotes are blocked.":w))];}
