import test from 'node:test';
import assert from 'node:assert/strict';
import {layout} from '../apps/printscale/core.mjs';

const base={width:400,height:300,paperWidth:210,paperHeight:297,margin:10,overlap:10};

test('tiles cover the target with exact overlap and row-major order',()=>{
  const result=layout(base);
  assert.equal(result.cols,3);
  assert.equal(result.rows,2);
  assert.equal(result.tiles.length,6);
  assert.equal(result.tiles[1].x,180);
  assert.equal(result.tiles[3].y,267);
  assert.deepEqual(result.tiles.map(({row,col})=>[row,col]),[[1,1],[1,2],[1,3],[2,1],[2,2],[2,3]]);
  assert.equal(result.tiles[0].x+result.w-result.tiles[1].x,10);
  assert.equal(result.tiles[0].y+result.h-result.tiles[3].y,10);
});

test('a target smaller than the printable area uses one sheet',()=>{
  const result=layout({...base,width:100,height:100});
  assert.equal(result.tiles.length,1);
  assert.equal(result.tiles[0].x,0);
  assert.equal(result.tiles[0].y,0);
});

test('rejects dimensions that cannot produce a valid printable grid',()=>{
  for(const patch of [
    {overlap:190},{width:100000},{width:NaN},{height:0},
    {paperWidth:0},{paperHeight:0},{margin:150},{overlap:Infinity},
  ]) assert.throws(()=>layout({...base,...patch}));
});

test('caps large posters at one hundred sheets',()=>{
  assert.throws(()=>layout({...base,width:10000,height:10000}),/Maximum 100 sheets/);
});
