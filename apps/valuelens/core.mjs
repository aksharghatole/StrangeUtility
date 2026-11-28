const UNITS = {
  g: { dimension: 'mass', factor: 1, label: 'g' },
  kg: { dimension: 'mass', factor: 1000, label: 'kg' },
  oz: { dimension: 'mass', factor: 28.349523125, label: 'oz' },
  lb: { dimension: 'mass', factor: 453.59237, label: 'lb' },
  ml: { dimension: 'volume', factor: 1, label: 'ml' },
  l: { dimension: 'volume', factor: 1000, label: 'L' },
  'fl-oz': { dimension: 'volume', factor: 29.5735295625, label: 'fl oz' },
  item: { dimension: 'count', factor: 1, label: 'item' }
};

const BASE_LABELS = { mass: '100 g', volume: '100 ml', count: 'item' };

export function normalizeProduct(product) {
  const name = String(product?.name ?? '').trim();
  const price = Number(product?.price);
  const amount = Number(product?.amount);
  const unit = UNITS[product?.unit];
  if (!name || name.length > 80) throw new Error('Name must be 1–80 characters.');
  if (!Number.isFinite(price) || price < 0 || price > 1e9) throw new Error('Price must be a non-negative number.');
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e9) throw new Error('Quantity must be greater than zero.');
  if (!unit) throw new Error('Choose a supported unit.');
  const baseAmount = amount * unit.factor;
  if (!Number.isFinite(baseAmount) || baseAmount <= 0) throw new Error('Quantity is outside the supported range.');
  const standardAmount = unit.dimension === 'count' ? 1 : 100;
  return {
    name,
    price,
    amount,
    unit: product.unit,
    unitLabel: unit.label,
    dimension: unit.dimension,
    baseAmount,
    pricePerStandard: price / baseAmount * standardAmount,
    standardLabel: BASE_LABELS[unit.dimension]
  };
}

export function compareProducts(products) {
  if (!Array.isArray(products) || products.length < 2 || products.length > 100) {
    throw new Error('Compare between 2 and 100 products.');
  }
  const groups = new Map();
  for (const source of products) {
    const product = normalizeProduct(source);
    const group = groups.get(product.dimension) ?? [];
    group.push(product);
    groups.set(product.dimension, group);
  }
  return [...groups.entries()].map(([dimension, items]) => ({
    dimension,
    standardLabel: items[0].standardLabel,
    items: items.sort((a, b) => a.pricePerStandard - b.pricePerStandard || a.name.localeCompare(b.name))
  }));
}

function csvCell(value) {
  const text = String(value);
  const guarded = /^[\s]*[=+@-]/.test(text) ? "'" + text : text;
  return '"' + guarded.replaceAll('"', '""') + '"';
}

export function comparisonCsv(groups, currency) {
  if (!Array.isArray(groups) || !/^[A-Z]{3}$/.test(String(currency))) {
    throw new Error('Provide comparison results and a three-letter currency code.');
  }
  const lines = [['Group', 'Product', 'Pack price', 'Quantity', 'Unit', 'Price per standard unit', 'Currency']];
  for (const group of groups) {
    for (const item of group.items) {
      lines.push([
        group.dimension,
        item.name,
        item.price.toFixed(2),
        item.amount,
        item.unitLabel,
        item.pricePerStandard.toFixed(4),
        currency
      ]);
    }
  }
  return lines.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
