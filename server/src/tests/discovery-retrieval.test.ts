import assert from 'node:assert/strict';
import test from 'node:test';
import { rankDiscoveryCandidates } from '../discovery-retrieval.js';

test('hybrid discovery ranking prefers exact and prefix matches',()=>{
  const rows=[
    {id:'2',kind:'people' as const,text:'ravi sharma',exact:0,prefix:0,popularity:.9,freshness:.8,personal:.1},
    {id:'1',kind:'people' as const,text:'Raghav',exact:1,prefix:1,popularity:.2,freshness:.5,personal:.2},
  ];
  const ranked=rankDiscoveryCandidates(rows,'raghav');
  assert.equal(ranked[0].id,'1');
});

test('hybrid discovery ranking is deterministic',()=>{
  const rows=[{id:'b',kind:'posts' as const,text:'science and space',popularity:.5},{id:'a',kind:'posts' as const,text:'science news',popularity:.5}];
  const first=rankDiscoveryCandidates(rows,'science');
  const second=rankDiscoveryCandidates(rows,'science');
  assert.deepEqual(first.map(x=>x.id),second.map(x=>x.id));
});
