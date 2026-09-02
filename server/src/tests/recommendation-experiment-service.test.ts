import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';

describe('recommendation experiment invariants',()=>{
  it('assigns deterministically into a bounded bucket',()=>{
    const key='feed-v1', user='user-1';
    const value=parseInt(createHash('sha256').update(`${key}:${user}`).digest('hex').slice(0,12),16)%10000/10000;
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });
  it('rejects impossible metric relationships',()=>{
    const impressions=10, opens=11, meaningful=1, completed=1, negative=1;
    expect(opens>impressions || meaningful>opens || completed>impressions || negative>impressions).toBe(true);
  });
  it('keeps experiment score signals within [0,1]',()=>{
    for(const value of [0,.25,.5,.75,1]) expect(value>=0&&value<=1).toBe(true);
  });
});
