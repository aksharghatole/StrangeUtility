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
    { name: 'Local app', href: 'apps/local/' },
    { name: 'Hosted app', href: 'https://example.com/app' },
  ]);
});

test('portal markup contains no descriptions, filters, or non-app navigation', () => {
  const html = readFileSync('index.html', 'utf8');
  const source = readFileSync('portal/portal.js', 'utf8');
  assert.match(html, /<nav id="apps" aria-label="Launch an app"><\/nav>/);
  assert.doesNotMatch(html, /source and issues|search applications|category/i);
  assert.doesNotMatch(source, /app\.description|app\.notes|app\.source|androidRelease|apkWorkflow/);
});
