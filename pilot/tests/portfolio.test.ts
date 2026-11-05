import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demoBrief} from '../lib/demo';
import {mergePortfolio,portfolioSummary,replacePortfolioPosition,type PortfolioResults} from '../app/portfolio';

function page(positions:PortfolioResults['positions'],extra:Partial<PortfolioResults>={}):PortfolioResults{return {mode:'live',snapshotId:'qa',positions,warnings:[],hasNextPools:false,poolPage:1,morePositions:[],handles:Object.fromEntries(positions.map(p=>[p.address,`handle-${p.address}`])),...extra};}
test('pool pages accumulate unique positions without replacing displayed balances or mismatching handles',async()=>{
 const p=(await demoBrief()).position,other={...p,address:'second'};
 const first=page([p],{hasNextPools:true,indexedPositionCount:2,handles:{[p.address]:'old'}});
 const next=page([{...p,inventory:{x:'999',y:'999'}},other],{poolPage:2,handles:{[p.address]:'new',second:'second'}});
 const result=mergePortfolio(first,next);assert.equal(result.positions.length,2);assert.deepEqual(result.positions[0].inventory,p.inventory);assert.equal(result.handles[p.address],'old');assert.equal(result.poolPage,2);assert.equal(result.indexedPositionCount,2);assert.equal(result.hasNextPools,false);
});
test('per-pool position pages preserve unrelated pool and position pagination',async()=>{
 const p=(await demoBrief()).position;
 const first=page([p],{poolPage:3,hasNextPools:true,morePositions:[{pool:'A',nextPage:2},{pool:'B',nextPage:2}]});
 const result=mergePortfolio(first,page([],{poolPage:2,morePositions:[{pool:'A',nextPage:3}]}),'A');
 assert.equal(result.poolPage,3);assert.equal(result.hasNextPools,true);assert.deepEqual(result.morePositions,[{pool:'B',nextPage:2},{pool:'A',nextPage:3}]);
 const finished=mergePortfolio(result,page([]),'A');assert.deepEqual(finished.morePositions,[{pool:'B',nextPage:2}]);
});
test('identity conflicts and demo/live mixing cannot quietly replace positions',async()=>{
 const p=(await demoBrief()).position;const r=mergePortfolio(page([p]),page([{...p,owner:'changed'}]));assert.equal(r.positions[0].owner,p.owner);assert.match(r.warnings.join(' '),/conflicting/);assert.throws(()=>mergePortfolio(page([p]),page([p],{mode:'demo'})),/mix/);
});
test('coverage and health reflect loaded observations, unknown fees and stale times without inventing valuation',async()=>{
 const p=(await demoBrief()).position,now=Date.now();const r=page([{...p,rangeStatus:'unknown',updatedAt:null,fees:{x:null,y:null}}],{indexedPositionCount:9});
 const summary=portfolioSummary(r,now);assert.equal(summary.partial,true);assert.equal(summary.count,1);assert.equal(summary.unknownRange,1);assert.equal(summary.missingFees,1);assert.equal(summary.stale,1);assert.equal('usdValue' in summary,false);
 assert.equal(portfolioSummary(page([{...p,updatedAt:Math.floor(now/1000)}]),now).partial,false);
});
test('explicit position refresh replaces the observation and its matching handle, retaining the portfolio',async()=>{
 const p=(await demoBrief()).position,other={...p,address:'second'},fresh={...p,inventory:{x:'3',y:'5'}};
 const r=replacePortfolioPosition(page([p,other],{poolPage:2}),fresh,'fresh');assert.equal(r.positions.length,2);assert.deepEqual(r.positions[0],fresh);assert.equal(r.handles[p.address],'fresh');assert.equal(r.poolPage,2);
});
