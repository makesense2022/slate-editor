import test from 'node:test';
import assert from 'node:assert/strict';
import { proseMirrorToSlate, slateToProseMirror } from '../src/utils/dataConverter.js';
import { safeLinkUrl } from '../src/utils/safeLinkUrl.js';
const text = value => [{text:value}];
test('empty imported documents retain one editable paragraph', () => {
  for(const doc of [{type:'doc',content:[]},{type:'doc',content:[{type:'paragraph'}]},{type:'doc',content:{}}])
    assert.deepEqual(proseMirrorToSlate(doc),[{type:'paragraph',children:[{text:''}]}]);
});
test('alternating list types keep source order instead of joining nonadjacent groups', () => {
  const doc=slateToProseMirror([{type:'bulleted-list',children:text('A')},{type:'numbered-list',listNumber:4,children:text('B')},{type:'bulleted-list',children:text('C')}]);
  assert.deepEqual(doc.content.map(n=>n.type),['bulletList','orderedList','bulletList']);
  assert.deepEqual(doc.content.map(n=>n.content[0].content[0].content[0].text),['A','B','C']);
  assert.equal(doc.content[1].attrs.start,4);
});
test('ordered list starting at zero survives the supported flat conversion', () => {
  const doc={type:'doc',content:[{type:'orderedList',attrs:{start:0},content:[{type:'listItem',content:[{type:'paragraph',content:[{type:'text',text:'Zero'}]}]}]}]};
  assert.equal(slateToProseMirror(proseMirrorToSlate(doc)).content[0].attrs.start,0);
});
test('public converters leave original input unchanged', () => {
  const doc={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Keep',marks:[{type:'bold'}]}]}]};
  const before=JSON.stringify(doc);slateToProseMirror(proseMirrorToSlate(doc));assert.equal(JSON.stringify(doc),before);
});

const roundTrip = content => slateToProseMirror(proseMirrorToSlate({ type: 'doc', content }));
const paragraph = value => ({ type: 'paragraph', content: [{ type: 'text', text: value }] });

test('inline math survives between marked text on save', () => {
  const content = [{ type: 'paragraph', content: [
    { type: 'text', text: 'before', marks: [{ type: 'bold' }] },
    { type: 'mathNode', attrs: { latex: 'x^2', displayMode: false } },
    { type: 'text', text: 'after' },
  ] }];
  assert.deepEqual(roundTrip(content).content, content);
});

test('standard and legacy quotes retain text inside valid paragraph blocks', () => {
  const quote = { type: 'blockquote', content: [paragraph('quoted text')] };
  assert.deepEqual(roundTrip([quote]).content, [quote]);
  assert.deepEqual(roundTrip([{ type: 'blockquote', content: quote.content[0].content }]).content, [quote]);
  const multiple = roundTrip([{ type: 'blockquote', content: [paragraph('first'), paragraph('second')] }]);
  assert.deepEqual(multiple.content[0].content[0].content, [
    { type: 'text', text: 'first' }, { type: 'hardBreak' }, { type: 'text', text: 'second' },
  ]);
});

test('all six heading levels survive conversion', () => {
  for (let level = 1; level <= 6; level++) {
    const node = { type: 'heading', attrs: { level }, content: [{ type: 'text', text: 'heading' }] };
    assert.deepEqual(roundTrip([node]).content, [node]);
  }
});

test('empty blocks remain positioned without emitting invalid empty text nodes', () => {
  const content = [paragraph('before'), { type: 'paragraph', content: [] }, paragraph('after')];
  assert.deepEqual(roundTrip(content).content, content);
  assert.deepEqual(roundTrip([]).content, [{ type: 'paragraph', content: [] }]);
  assert.deepEqual(roundTrip([{ type: 'heading', attrs: { level: 2 }, content: [] }]).content[0].content, []);
});

test('hard breaks survive in text while code blocks keep literal newlines', () => {
  const content = [{ type: 'paragraph', content: [
    { type: 'text', text: 'line one' }, { type: 'hardBreak' }, { type: 'text', text: 'line two' },
  ] }, { type: 'codeBlock', attrs: { language: 'javascript' }, content: [{ type: 'text', text: 'one\ntwo' }] }];
  assert.deepEqual(roundTrip(content).content, content);
});

test('table headers and inline math in cells survive conversion', () => {
  const content = [{ type: 'table', content: [{ type: 'tableRow', content: [
    { type: 'tableHeader', attrs: { colspan: 2 }, content: [paragraph('header')] },
    { type: 'tableCell', attrs: {}, content: [{ type: 'paragraph', content: [
      { type: 'mathNode', attrs: { latex: 'a+b', displayMode: false } },
    ] }] },
  ] }] }];
  assert.deepEqual(roundTrip(content).content, content);
});

test('link rendering rejects executable URLs including control-character obfuscation', () => {
  for (const unsafe of ['javascript:alert(1)', 'java\nscript:alert(1)', 'data:text/html,<script>', 'file:///tmp/doc', '', null]) {
    assert.equal(safeLinkUrl(unsafe), '');
  }
  for (const safe of ['https://example.com', 'http://localhost', 'mailto:reader@example.com', 'tel:123', '/doc', '#section']) {
    assert.equal(safeLinkUrl(safe), safe);
  }
});
