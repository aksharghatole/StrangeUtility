import test from 'node:test';
import assert from 'node:assert/strict';
import { compareProducts, comparisonCsv, normalizeProduct } from '../apps/valuelens/core.mjs';

test('converts mass and ranks equivalent pack quantities', () => {
  const groups = compareProducts([
    { name: 'small', price: 4, amount: 500, unit: 'g' },
    { name: 'large', price: 7, amount: 1, unit: 'kg' }
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].standardLabel, '100 g');
  assert.equal(groups[0].items[0].name, 'large');
  assert.equal(groups[0].items[0].pricePerStandard, 0.7);
});

test('separates mass, volume and count rather than comparing unlike quantities', () => {
  const groups = compareProducts([
    { name: 'rice', price: 10, amount: 1, unit: 'kg' },
    { name: 'milk', price: 10, amount: 1, unit: 'l' },
    { name: 'eggs', price: 10, amount: 10, unit: 'item' }
  ]);
  assert.deepEqual(groups.map(group => group.dimension).sort(), ['count', 'mass', 'volume']);
});

test('converts ounces, pounds, fluid ounces and litres to the expected base', () => {
  assert.ok(Math.abs(normalizeProduct({name:'oz',price:1,amount:1,unit:'oz'}).baseAmount - 28.349523125) < 1e-10);
  assert.ok(Math.abs(normalizeProduct({name:'lb',price:1,amount:1,unit:'lb'}).baseAmount - 453.59237) < 1e-10);
  assert.ok(Math.abs(normalizeProduct({name:'fl oz',price:1,amount:1,unit:'fl-oz'}).baseAmount - 29.5735295625) < 1e-10);
  assert.equal(normalizeProduct({name:'litres',price:1,amount:1,unit:'l'}).baseAmount, 1000);
});

test('validates names, price, quantity, unit and comparison size', () => {
  assert.throws(() => normalizeProduct({name:'',price:1,amount:1,unit:'kg'}), /Name/);
  assert.throws(() => normalizeProduct({name:'x',price:-1,amount:1,unit:'kg'}), /Price/);
  assert.throws(() => normalizeProduct({name:'x',price:1,amount:0,unit:'kg'}), /Quantity/);
  assert.throws(() => normalizeProduct({name:'x',price:1,amount:1,unit:'cup'}), /unit/i);
  assert.throws(() => compareProducts([{name:'one',price:1,amount:1,unit:'item'}]), /2 and 100/);
});

test('CSV quotes cells and guards formula-like product names', () => {
  const groups=compareProducts([
    {name:'=IMPORTXML("x")',price:1,amount:1,unit:'item'},
    {name:'safe, "name"',price:2,amount:1,unit:'item'}
  ]);
  const csv=comparisonCsv(groups,'INR');
  assert.match(csv, /"'=IMPORTXML(""x"")"/);
  assert.match(csv, /"safe, ""name"""/);
  assert.match(csv, /"INR"/);
});
