import {test} from 'node:test';
import assert from 'node:assert/strict';
import {money,allocate,split} from '../apps/receiptsplit/core.mjs';
test('strict money parser',()=>{assert.equal(money('12.3'),1230);for(const x of ['-1','1.001','1e3','NaN',''])assert.throws(()=>money(x));});
test('odd cents deterministic',()=>assert.deepEqual(allocate(100,[1,1,1]),[34,33,33]));
test('weighted extras and shared dishes reconcile',()=>{const r=split(['A','B','C'],[{label:'Pizza',amount:1001,people:['A','B']},{label:'Tea',amount:300,people:['C']}],131);assert.equal(r.total,1432);assert.deepEqual(r.people.map(p=>p.items),[501,500,300]);assert.equal(r.people.reduce((s,p)=>s+p.total,0),1432);assert.deepEqual(r.people.map(p=>p.extras),[51,50,30]);});
test('reject invalid shares',()=>{assert.throws(()=>split(['A','B'],[{label:'x',amount:100,people:['C']}],0));assert.throws(()=>allocate(1,[0,0]));assert.throws(()=>split(['A','A'],[],0));});
test('allocation conservation across varied weights',()=>{for(let a=0;a<500;a++){const w=[a+1,3,17,0];const p=allocate(a,w);assert.equal(p.reduce((s,v)=>s+v,0),a);assert.equal(p[3],0);}});

test('discount and extras reconcile exactly',()=>{const r=split(['A','B'],[{label:'x',amount:101,people:['A','B']}],9,31);assert.equal(r.total,79);assert.deepEqual(r.people.map(p=>p.discount),[16,15]);assert.equal(r.people.reduce((s,p)=>s+p.total,0),79);});
test('discount bounds and fully discounted receipt',()=>{const items=[{label:'x',amount:100,people:['A']}];assert.throws(()=>split(['A','B'],items,0,101));assert.equal(split(['A','B'],items,0,100).total,0);assert.throws(()=>split(['A','B'],items,1,100));});
