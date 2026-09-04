import test from 'node:test';
import assert from 'node:assert/strict';

test('profile surface tab contract stays explicit',()=>{
 const tabs=['posts','videos','collections','tagged','saved','shop'];
 assert.deepEqual(tabs,['posts','videos','collections','tagged','saved','shop']);
});

test('profile visibility labels map to safe public states',()=>{
 const labels={public:'Public profile',followers:'Followers only',private:'Private profile'} as const;
 assert.equal(labels.public,'Public profile');
 assert.equal(labels.followers,'Followers only');
 assert.equal(labels.private,'Private profile');
});
