import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { EditorComponent } from '../dist/index.js';
import 'katex/dist/katex.min.css';

const paragraph = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const richContent = [
  paragraph('编辑回归'),
  { type: 'heading', attrs: { level: 6 }, content: [{ type: 'text', text: '六级标题' }] },
  { type: 'paragraph', content: [
    { type: 'text', text: '公式前 ' },
    { type: 'mathNode', attrs: { latex: 'x^2', displayMode: false } },
    { type: 'text', text: ' 公式后' },
  ] },
  { type: 'blockquote', content: [paragraph('引用内容')] },
  { type: 'orderedList', attrs: { start: 0 }, content: [
    { type: 'listItem', content: [paragraph('从零开始')] },
  ] },
  { type: 'table', content: [{ type: 'tableRow', content: [
    { type: 'tableHeader', content: [paragraph('表头')] },
    { type: 'tableCell', content: [paragraph('单元格')] },
  ] }] },
];

function Consumer() {
  const [documentId, setDocumentId] = useState('a');
  const [readOnly, setReadOnly] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [renderCount, setRenderCount] = useState(0);
  const [saveCount, setSaveCount] = useState(0);
  const [submitCount, setSubmitCount] = useState(0);
  const [saved, setSaved] = useState('尚未收到保存回调');
  // Deliberately recreate initialData on parent renders to verify initial-only semantics.
  const data = { type: 'doc', content: location.search.includes('rich=1')
    ? richContent : [paragraph(documentId === 'a' ? '本地合成文档 A' : '本地合成文档 B')] };

  return <main>
    <h1>Slate 包入口最小消费者</h1>
    <p>合成文档；切换文档通过 key 重挂载，initialData 不是受控 value。</p>
    <button onClick={() => setReadOnly(v => !v)}>{readOnly ? '切为编辑' : '切为只读'}</button>
    <button onClick={() => setShowControls(v => !v)}>切换块控件</button>
    <button onClick={() => setDocumentId(v => v === 'a' ? 'b' : 'a')}>切换文档并重挂载</button>
    <button onClick={() => setRenderCount(v => v + 1)}>宿主重渲染</button>
    <span data-testid="renders">{renderCount}</span>
    <form data-testid="primary" onSubmit={e => { e.preventDefault(); setSubmitCount(v => v + 1); }}>
      <EditorComponent key={documentId} initialData={data} readOnly={readOnly} showBlockControls={showControls}
        onSave={value => { setSaved(JSON.stringify(value)); setSaveCount(v => v + 1); }} />
    </form>
    <p>本地回调内容 · 次数 <span data-testid="save-count">{saveCount}</span> · 表单提交 <span data-testid="submit-count">{submitCount}</span></p>
    <output data-testid="saved">{saved}</output>
    <details><summary>第二个独立编辑器</summary>
      <section data-testid="secondary"><EditorComponent initialData={{ type: 'doc', content: [paragraph('独立文档')] }} /></section>
    </details>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Consumer />);
