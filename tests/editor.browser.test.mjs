import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const artifacts = new URL('../artifacts/consumer/', import.meta.url);
const mimeTypes = { js: 'text/javascript', css: 'text/css', html: 'text/html' };
const primary = page => page.getByTestId('primary');
const editor = page => primary(page).locator('[data-slate-editor]');
const saved = page => page.getByTestId('saved');
const strings = page => primary(page).locator('[data-slate-string]');
const lineEnd = process.platform === 'darwin' ? 'Meta+ArrowRight' : 'End';
const lineStart = process.platform === 'darwin' ? 'Meta+ArrowLeft' : 'Home';
const replaceText = async (page, text) => {
  await editor(page).click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Backspace');
  await page.keyboard.insertText(text);
};
const waitSaved = async (page, text) => {
  await page.waitForFunction(text => document.querySelector('[data-testid="saved"]').textContent.includes(text), text);
  return JSON.parse(await saved(page).textContent());
};

// Tests consume dist/index.js through the bundled consumer rather than source modules.
test('packaged editor browser regressions', async t => {
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, 'http://localhost').pathname;
      if (pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
      const file = pathname === '/' ? 'index.html' : pathname.slice(1);
      if (!['index.html', 'app.js', 'app.css'].includes(file)) { response.writeHead(404).end(); return; }
      response.setHeader('Content-Type', mimeTypes[file.split('.').at(-1)]);
      response.end(await readFile(new URL(file, artifacts)));
    } catch { response.writeHead(500).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.SLATE_BROWSER_CHANNEL ? { channel: process.env.SLATE_BROWSER_CHANNEL } : {}) });
    const url = `http://127.0.0.1:${server.address().port}`;
    const check = async (name, run, query = '') => t.test(name, async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      page.setDefaultTimeout(5000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      try {
        await page.goto(url + query);
        await editor(page).waitFor();
        await run(page);
        assert.deepEqual(errors, [], 'browser errors');
      } finally { await page.close(); }
    });

    await check('initial data is initial-only; saves are debounced without rerender loops', async page => {
      await page.waitForTimeout(1200);
      assert.equal(await page.getByTestId('save-count').textContent(), '0');
      await page.getByRole('button', { name: '宿主重渲染' }).click();
      await page.waitForTimeout(1200);
      assert.equal(await page.getByTestId('save-count').textContent(), '0');
      await replaceText(page, 'edited content');
      const document = await waitSaved(page, 'edited content');
      assert.equal(document.content[0].content[0].text, 'edited content');
      await page.getByRole('button', { name: '宿主重渲染' }).click();
      await page.waitForTimeout(1200);
      assert.equal(await page.getByTestId('save-count').textContent(), '1');
      await page.getByRole('button', { name: '切换文档并重挂载' }).click();
      assert.equal(await strings(page).first().textContent(), '本地合成文档 B');
    });

    await check('inline math, table headers, quotes and all imported text survive actual editing', async page => {
      assert.equal(await primary(page).locator('.katex').count(), 1);
      assert.equal(await primary(page).locator('[data-slate-inline="true"]').count(), 1);
      assert.equal(await primary(page).locator('th').textContent(), '表头');
      assert.equal(await primary(page).locator('blockquote').textContent(), '引用内容');
      await strings(page).first().click();
      await page.keyboard.press(lineEnd);
      await page.keyboard.insertText(' edit');
      const document = await waitSaved(page, ' edit');
      assert.equal(document.content.find(node => node.type === 'heading').attrs.level, 6);
      assert.equal(document.content.find(node => node.type === 'blockquote').content[0].content[0].text, '引用内容');
      assert.equal(document.content[2].content.find(node => node.type === 'mathNode').attrs.latex, 'x^2');
      assert.equal(document.content.find(node => node.type === 'orderedList').attrs.start, 0);
      assert.ok((await primary(page).textContent()).includes('0.'));
      await page.screenshot({ path: fileURLToPath(new URL('desktop-review.png', artifacts)), fullPage: true });
    }, '?rich=1');

    await check('read-only toggles hide controls and block todo/formula mutations', async page => {
      await page.getByRole('button', { name: '☐ 待办' }).click();
      let prompts = 0;
      page.on('dialog', async dialog => { prompts++; await dialog.accept('x^2'); });
      await page.getByRole('button', { name: '🧮 公式' }).click();
      await primary(page).locator('.formula-container').waitFor();
      await waitSaved(page, 'x^2');
      assert.equal(await page.getByTestId('submit-count').textContent(), '0');
      await page.getByRole('button', { name: '切换块控件' }).click();
      assert.equal(await primary(page).locator('.plus-button').count(), 0);
      await page.getByRole('button', { name: '切换块控件' }).click();
      assert.ok(await primary(page).locator('.plus-button').count() > 0);
      await page.getByRole('button', { name: '切为只读' }).click();
      const before = await saved(page).textContent();
      const beforeText = await primary(page).textContent();
      const promptCount = prompts;
      assert.equal(await primary(page).locator('.plus-button').count(), 0);
      assert.equal(await primary(page).locator('button').count(), 0);
      await primary(page).getByText('☐', { exact: true }).click();
      await primary(page).locator('.formula-container').dblclick();
      await page.waitForTimeout(1200);
      assert.equal(prompts, promptCount);
      assert.equal(await saved(page).textContent(), before);
      assert.equal(await primary(page).textContent(), beforeText);
    });

    await check('plus insertion belongs to its editor and works at offset zero', async page => {
      await page.getByText('第二个独立编辑器', { exact: true }).click();
      await primary(page).locator('.block-wrapper').first().hover();
      await primary(page).locator('.plus-button').first().click();
      assert.equal(await page.getByText('大标题', { exact: true }).count(), 1);
      await page.getByText('大标题', { exact: true }).click();
      assert.equal(await primary(page).locator('h1').count(), 1);
      assert.equal(await page.getByTestId('secondary').locator('h1').count(), 0);
      assert.ok((await page.getByTestId('secondary').textContent()).includes('独立文档'));
    });

    await check('slash keyboard selection consumes the slash and does not insert another block', async page => {
      await strings(page).first().click();
      await page.keyboard.press(lineStart);
      await page.keyboard.type('/');
      await page.getByText('大标题', { exact: true }).waitFor();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      assert.equal(await primary(page).locator('h1').count(), 1);
      assert.equal(await primary(page).locator('.block-wrapper').count(), 1);
      assert.equal(await strings(page).first().textContent(), '本地合成文档 A');
    });

    await check('deleting the final block leaves a usable empty paragraph', async page => {
      await editor(page).click();
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press('Backspace');
      await page.keyboard.insertText('after keyboard delete');
      await waitSaved(page, 'after keyboard delete');
      await primary(page).locator('.block-wrapper').first().hover();
      await primary(page).locator('.drag-handle').first().click();
      await page.getByText('删除', { exact: true }).click();
      await editor(page).click();
      await page.keyboard.insertText('after menu delete');
      await waitSaved(page, 'after menu delete');
      assert.equal(await primary(page).locator('.block-wrapper').count(), 1);
    });

    await check('move-down advances one block and copies can be edited independently', async page => {
      await replaceText(page, 'first');
      await page.keyboard.press('Enter');
      await page.keyboard.insertText('second');
      await page.keyboard.press('Enter');
      await page.keyboard.insertText('third');
      await primary(page).locator('.block-wrapper').first().hover();
      await primary(page).locator('.drag-handle').first().click();
      await page.getByText('下移', { exact: true }).click();
      assert.deepEqual(await strings(page).allTextContents(), ['second', 'first', 'third']);
      await primary(page).locator('.block-wrapper').first().hover();
      await primary(page).locator('.drag-handle').first().click();
      await page.getByText('复制块', { exact: true }).click();
      assert.deepEqual(await strings(page).allTextContents(), ['second', 'second', 'first', 'third']);
      await strings(page).nth(1).click();
      await page.keyboard.press(lineEnd);
      await page.keyboard.insertText(' copy');
      assert.deepEqual(await strings(page).allTextContents(), ['second', 'second copy', 'first', 'third']);
    });

    await check('numbered list Enter splits content and advances the cursor and number', async page => {
      await primary(page).getByText('从零开始', { exact: true }).click();
      await page.keyboard.press(lineEnd);
      await page.keyboard.press('Enter');
      await page.keyboard.insertText('下一项');
      const document = await waitSaved(page, '下一项');
      const list = document.content.find(node => node.type === 'orderedList');
      assert.equal(list.content.length, 2);
      assert.equal(list.content[1].content[0].content[0].text, '下一项');
      assert.ok((await primary(page).textContent()).includes('1.'));
    }, '?rich=1');

    await check('mobile toolbar wraps and the consumer has no horizontal overflow', async page => {
      await page.setViewportSize({ width: 390, height: 844 });
      const geometry = await primary(page).locator('button').evaluateAll(buttons => buttons.map(button => ({
        height: button.getBoundingClientRect().height,
        width: button.getBoundingClientRect().width,
      })));
      assert.ok(geometry.every(button => button.height < 60 && button.width > 25));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: fileURLToPath(new URL('mobile-review.png', artifacts)), fullPage: true });
    });
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
