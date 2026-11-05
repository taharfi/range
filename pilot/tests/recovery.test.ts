import test from "node:test";
import assert from "node:assert/strict";
import { refreshedSelection, type PositionResults } from "../app/recovery";
import { demoBrief } from "../lib/demo";

test("recovery selects the original position and its fresh handle, never the first result",async()=>{
  const previous=(await demoBrief()).position;
  const position={...previous,inventory:{x:"3",y:"400"}};
  const other={...previous,address:"other"};
  const result:PositionResults={mode:"live",snapshotId:"fresh",positions:[other,position],warnings:[],handles:{[previous.address]:"fresh-handle",other:"wrong"},hasNextPools:false,poolPage:1,morePositions:[]};
  assert.deepEqual(refreshedSelection(result,previous),{position,handle:"fresh-handle"});
  assert.notDeepEqual(previous.inventory,position.inventory);
});

test("partial, closed, synthetic or handle-free recovery cannot substitute another analysis",async()=>{
  const previous=(await demoBrief()).position;
  const result:PositionResults={mode:"live",snapshotId:"fresh",positions:[previous],warnings:[],handles:{[previous.address]:"fresh"},hasNextPools:false,poolPage:1,morePositions:[]};
  for(const change of [{positions:[]},{positions:[{...previous,address:"other"}]},{handles:{}},{mode:"demo" as const}])
    assert.throws(()=>refreshedSelection({...result,...change},previous),/previous analysis has been retained/);
});

test("recovery detects owner, pool, mint and decimal identity changes before requesting a quote",async()=>{
  const previous=(await demoBrief()).position;
  const result:PositionResults={mode:"live",snapshotId:"fresh",positions:[],warnings:[],handles:{[previous.address]:"fresh"},hasNextPools:false,poolPage:1,morePositions:[]};
  for(const change of [{owner:"new"},{pool:"new"},{x:{...previous.x,mint:"new"}},{y:{...previous.y,mint:"new"}},{x:{...previous.x,decimals:6}}])
    assert.throws(()=>refreshedSelection({...result,positions:[{...previous,...change}]},previous),/details changed/);
});
