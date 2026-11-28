import test from 'node:test';import assert from 'node:assert/strict';import{plan,exportPlan}from './core.mjs';
test('preserves extension and numbers names',()=>assert.equal(plan(['a.jpg'],{prefix:'x-',numbered:true,start:7})[0].target,'x-a_007.jpg'));
test('literal replacement',()=>assert.equal(plan(['a+b.txt'],{find:'+',replace:'-'})[0].target,'a-b.txt'));
test('collision blocks export',()=>{const rows=plan(['a.txt','b.txt'],{find:'a',replace:'b'});assert.ok(rows.every(r=>r.error));assert.throws(()=>exportPlan(rows));});
test('rejects invalid target and duplicate source',()=>{assert.ok(plan(['a.txt'],{prefix:'/'})[0].error);assert.ok(plan(['A.txt','a.txt']).every(r=>r.error));});
test('exports valid mapping',()=>assert.deepEqual(JSON.parse(exportPlan(plan(['.env'],{prefix:'old-'}))),[{original:'.env',target:'old-.env'}]));
test('rejects invalid start',()=>assert.throws(()=>plan(['a'],{start:NaN})));
