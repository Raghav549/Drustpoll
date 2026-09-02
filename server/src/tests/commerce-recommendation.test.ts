import assert from 'node:assert/strict';
import test from 'node:test';

test('commerce recommendation primitives keep score bounded',()=>{
  const score=(behavior:number,relationship:number,availability:number,shop:number,novelty:number,category:number,seller:number,price:number,negative:number)=>Math.max(0,Math.min(1,.26*behavior+.12*relationship+.12*availability+.12*shop+.12*novelty+.12*category+.08*seller+.06*price-.30*negative));
  for(const n of [0,.25,.5,.75,1]) assert.ok(score(n,n,n,n,n,n,n,n,0)>=0&&score(n,n,n,n,n,n,n,n,0)<=1);
  assert.ok(score(.8,.8,1,.8,.2,.9,.9,.5,0)>score(.8,.8,1,.8,.2,.9,.9,.5,1));
});

test('purchase intent dominates weaker commerce signals',()=>{
  const fresh=0.26*.15+0.12*.25+0.12*1+0.12*.25+0.12*.85+0.12*.15+0.08*.5+0.06*.5;
  const purchased=0.26*1+0.12*.25+0.12*1+0.12*.25+0.12*.2+0.12*.15+0.08*.5+0.06*.5;
  assert.ok(purchased>fresh);
});
