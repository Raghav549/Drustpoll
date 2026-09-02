import assert from 'node:assert/strict';
import test from 'node:test';
import { allowRequest } from '../security-middleware.js';

test('rate limiter allows a normal request burst',()=>{
  const req:any={socket:{remoteAddress:'203.0.113.10'},headers:{'user-agent':'test-agent'}};
  assert.equal(allowRequest(req),true);
});

test('rate limiter rejects after the configured burst',()=>{
  const req:any={socket:{remoteAddress:'203.0.113.11'},headers:{'user-agent':'abuse-test'}};
  let allowed=0;for(let i=0;i<130;i++)if(allowRequest(req))allowed++;
  assert.equal(allowed,120);
  assert.equal(allowRequest(req),false);
});
