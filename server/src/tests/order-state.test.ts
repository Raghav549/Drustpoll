import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionOrder, ORDER_TRANSITIONS, type OrderStatus } from '../order-state.js';

test('terminal order states cannot transition',()=>{for(const state of ['cancelled','refunded'] as OrderStatus[])for(const target of Object.keys(ORDER_TRANSITIONS) as OrderStatus[])assert.equal(canTransitionOrder(state,target),false);});
test('order transitions are explicit',()=>{assert.equal(canTransitionOrder('pending_payment','paid'),true);assert.equal(canTransitionOrder('pending_payment','processing'),false);assert.equal(canTransitionOrder('shipped','delivered'),true);assert.equal(canTransitionOrder('delivered','processing'),false);});
