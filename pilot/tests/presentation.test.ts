import test from "node:test";
import assert from "node:assert/strict";
import {amount,positionState,qualityNotes,rangePrecision} from "../app/presentation";
import {D} from "../lib/math";
test("short token displays never round a quoted minimum upward or erase tiny nonzero amounts",()=>{
 assert.equal(amount("1234.56789"),"1,234.567");assert.equal(amount("0.000000123456"),"1.23e-7");
 assert.equal(amount("0"),"0");assert.equal(amount("1.999999"),"1.999");
});
test("missing and invalid values remain unavailable instead of becoming zero",()=>{
 for(const value of [null,undefined,"NaN","Infinity","-1","bad"])assert.equal(amount(value),"Unavailable");
});
test("guidance distinguishes unknown range status and never guarantees returns",()=>{
 assert.match(positionState("in-range").detail,/not guaranteed/);assert.match(positionState("out-of-range").detail,/may stop/);
 assert.match(positionState("unknown").title,/cannot confirm/);
});
test("contextual warning compression preserves unknown limitations and quote blockers",()=>{
 const notes=qualityNotes(["Mint owner/decimals could not be independently checked or use an unsupported token program. Conversion quotes are blocked.","Indexed sub-atomic digits were rounded down", "Unexpected transfer restriction"]);
 assert.match(notes[0],/blocked/);assert.match(notes[1],/conservative/);assert.equal(notes[2],"Unexpected transfer restriction");
});
test("tight price ranges retain distinct boundaries and current-price labels",()=>{
 for(const values of [["90","130","100"],["100.00001","100.00002","100.000015"],["0.000000123456","0.000000123457","0.0000001234565"]]){
  const digits=rangePrecision(values);assert.equal(new Set(values.map(v=>new D(v).toSignificantDigits(digits).toString())).size,3);
 }
 assert.equal(rangePrecision(["90","130","100"]),4);
});
