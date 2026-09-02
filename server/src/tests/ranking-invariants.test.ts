import test from 'node:test';
import assert from 'node:assert/strict';
import { diversifySlate, watchAffinity, type ReelRankItem } from '../reels-ranking-pure.js';

test('watch affinity is bounded and duration-debiased',()=>{
  for(const watched of [0,1,100,1000,10000])for(const duration of [0,1,100,1000,10000]){
    const score=watchAffinity(watched,duration,2,0);assert.ok(score>=0&&score<=1);
  }
  assert.ok(watchAffinity(5000,10000)>watchAffinity(5000,20000));
});

test('slate optimizer never duplicates a candidate and respects size',()=>{
  const items:ReelRankItem[]=Array.from({length:30},(_,i)=>({postId:`p${i}`,creatorId:`c${i%4}`,topic:`t${i%3}`,score:1-i/100,reason:'test'}));
  const slate=diversifySlate(items,12);assert.equal(slate.length,12);assert.equal(new Set(slate.map(x=>x.postId)).size,12);assert.ok(slate.every(x=>x.score>=0));
});

test('slate optimizer is stable for empty and oversized inputs',()=>{assert.deepEqual(diversifySlate([],10),[]);const one=[{postId:'p',creatorId:'c',score:.5,reason:'test'}];assert.deepEqual(diversifySlate(one,99),one);});
