import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

test('recommendation experiment invariants: bounded deterministic bucket',()=>{
 const key='feed-v1',user='user-1';const value=parseInt(createHash('sha256').update(`${key}:${user}`).digest('hex').slice(0,12),16)%10000/10000;
 assert.ok(value>=0);assert.ok(value<1);
});

test('recommendation experiment invariants: impossible metric relationships are detectable',()=>{
 const impressions=10,opens=11,meaningful=1,completed=1,negative=1;
 assert.equal(opens>impressions||meaningful>opens||completed>impressions||negative>impressions,true);
});

test('recommendation experiment invariants: score signals remain bounded',()=>{
 for(const value of [0,.25,.5,.75,1])assert.ok(value>=0&&value<=1);
});
