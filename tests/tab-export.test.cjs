const test = require('node:test');
const assert = require('node:assert/strict');
const { prepareTabs, toMarkdown } = require('../src/tab-export.js');

test('preserves tab order, removes exact duplicates without mutating the input', () => {
  const tabs = [{ index: 2, url: 'https://example.com/b', title: 'B' },
    { index: 0, url: 'https://example.com/a', title: 'A' },
    { index: 1, url: 'https://example.com/a', title: 'Duplicate A' }];
  const original = JSON.stringify(tabs);
  assert.deepEqual(prepareTabs(tabs), { links: [{ title: 'A', url: 'https://example.com/a' },
    { title: 'B', url: 'https://example.com/b' }], duplicates: 1, skipped: 0 });
  assert.equal(JSON.stringify(tabs), original);
  assert.equal(prepareTabs(tabs, { deduplicate: false }).links.length, 3);
});

test('skips internal, malformed and credential-bearing URLs, preserving fragments and queries', () => {
  const urls = ['chrome://settings', 'file:///private/test', 'javascript:alert(1)',
    'data:text/plain,test', 'not a url', undefined, 'https://user:secret@example.com/',
    'https://example.com/?q=a#one', 'https://example.com/?q=a#two'];
  const result = prepareTabs(urls.map(url => ({ url })));
  assert.equal(result.skipped, 7);
  assert.equal(result.links.length, 2);
  assert.equal(result.links[0].title, 'example.com');
});

test('escapes Markdown and HTML in titles and safely wraps URLs with parentheses', () => {
  const { links } = prepareTabs([{ url: 'https://example.com/a(b)?q=<x>',
    title: '[click](https://evil.example)\n<script>& hi_*' }]);
  const markdown = toMarkdown(links);
  assert.ok(markdown.includes('\\[click\\]\\(https://evil.example\\) &lt;script&gt;&amp; hi\\_\\*'));
  assert.ok(markdown.includes('(<https://example.com/a(b)?q=%3Cx%3E>)'));
  assert.ok(!markdown.includes('<script>'));
  assert.equal(markdown.split('\n').filter(line => line.startsWith('- ')).length, 1);
});

test('empty windows produce no links and no misleading content', () => {
  assert.deepEqual(prepareTabs([]), { links: [], skipped: 0, duplicates: 0 });
});
