import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { launchLinks } from '../portal/portal.js';

test('portal exposes only launchable app destinations', () => {
  const links = launchLinks([
    { id: 'local', name: 'Local app', status: 'testing', path: 'apps/local/', source: 'https://github.com/source', notes: 'Hidden details' },
    { id: 'hosted', name: 'Hosted app', status: 'stable', existingUrl: 'https://example.com/app' },
    { id: 'queued', name: 'Queued app', status: 'queued', path: 'apps/queued/' },
    { id: 'source-only', name: 'Source only', status: 'testing', source: 'https://github.com/source' },
    { id: 'unsafe', name: 'Unsafe', status: 'stable', existingUrl: 'javascript:alert(1)' },
    { id: 'bad-path', name: 'Bad path', status: 'stable', path: 'https://example.com/' },
  ]);

  assert.deepEqual(links, [
    { name: 'Local app', description: 'Open this app.', href: 'apps/local/' },
    { name: 'Hosted app', description: 'Open this app.', href: 'https://example.com/app' },
  ]);
});

test('portal cards show launch links and short descriptions without filters or extra navigation', () => {
  const html = readFileSync('index.html', 'utf8');
  const source = readFileSync('portal/portal.js', 'utf8');
  assert.match(html, /<section id="apps" class="app-list" aria-label="Apps"><\/section>/);
  assert.match(source, /description\.textContent = app\.description/);
  assert.match(source, /rawDescription\.slice\(0, 137\)/);
  assert.doesNotMatch(html, /source and issues|search applications|category/i);
  assert.doesNotMatch(source, /app\.notes|app\.source|androidRelease|apkWorkflow/);
});

test('portal trims descriptions and caps their display length', () => {
  const [app] = launchLinks([{ id: 'local', name: 'Local app', path: 'apps/local/', description: `  ${'A'.repeat(200)}  ` }]);
  assert.equal(app.description.length, 138);
  assert.equal(app.description, `${'A'.repeat(137)}…`);
});
