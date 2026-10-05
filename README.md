# Slate Editor

一个基于 Slate.js 的 React 富文本编辑器组件库，提供块工具栏、标题、列表、引用、代码、图片、公式和表格渲染，以及 ProseMirror/TipTap JSON 转换。

包名为 `@makesense2022/slate-editor`。此仓库的 GitHub 推送不代表 npm 发布；本轮没有执行 npm publish。

## 从源码使用

需要 Node.js 22 和 pnpm 10。

```sh
pnpm install --frozen-lockfile
pnpm run build
```

包入口为 `src/index.ts` → `dist/index.js`，只有命名导出。可通过 `pnpm pack` 生成本地包，再在宿主项目安装生成的 `.tgz` 文件。

```tsx
import { EditorComponent } from '@makesense2022/slate-editor';
import 'katex/dist/katex.min.css';

function DocumentEditor({ documentId, document, saveDocument }) {
  return (
    <EditorComponent
      key={documentId}
      initialData={document}
      onSave={saveDocument}
    />
  );
}
```

宿主需要安装 peer dependencies：React/ReactDOM 18.2+ 或 19，以及 package.json 指定范围内的 Slate 0.124、slate-history 0.113、slate-react 0.117。当前回归验证使用 React 19.2.7，没有测试完整版本矩阵。公式使用本地 KaTeX 依赖渲染，不依赖运行时 CDN；样式由宿主导入。

## API 与保存边界

| 属性 | 类型 | 默认值 | 行为 |
| --- | --- | --- | --- |
| `initialData` | ProseMirror JSON | 欢迎段落 | 仅在组件挂载时读取；不是受控 value |
| `readOnly` | `boolean` | `false` | 禁用输入、块操作、待办切换和公式编辑，并隐藏工具栏 |
| `showToolbar` | `boolean` | `true` | 控制工具栏显示 |
| `showBlockControls` | `boolean` | `true` | 控制加号、块菜单等控件显示，可动态切换 |
| `onSave` | `(data: any) => void` | 无 | 内容变化后防抖 1000 ms 回调 ProseMirror JSON；可返回 Promise |

更换文档时用稳定文档 ID 作为 React `key` 重挂载。重新创建相同的 `initialData` 对象不会替换正在编辑的文档，也不会触发重复保存。只改变光标或选区不会保存。

`onSave` 不负责持久化。宿主负责保存顺序、失败反馈与重试；组件会记录回调错误，但不自动重试。卸载、关闭页面或在防抖到期前切入只读模式时，不保证挂起内容已保存。异步保存可能并发，宿主应按文档和版本处理结果。

`src/index.ts` 还导出已有元素/菜单组件、`proseMirrorToSlate`、`slateToProseMirror` 和 `useDebounce`，没有默认导出。

## 数据转换支持范围

转换器支持段落、1–6 级标题、基本文本标记（粗体、斜体、行内代码、链接）、换行、平面列表、图片、代码块、引用、`mathNode` 与基本表格。空段落保留位置，输出不包含 ProseMirror 禁止的空文本节点；行内公式、列表起始序号（包括 0）和相邻列表的次序均有回归测试。

它不是任意 ProseMirror schema 的无损存档格式。需要保留原始文档，并针对宿主的实际 schema 验证往返转换：

- 嵌套列表最多保留现有的浅层展示缩进，保存时会展开；不保留完整嵌套结构和未知节点属性。
- 引用和表格单元格的多个段落会合并成带换行的内容；复杂嵌套块不在支持范围内。
- 编辑器新建的待办事项保存为带勾选字符的无序列表；新建的公式块保存为 `$$...$$` 文本。重新载入后不恢复为交互式待办/公式块。
- 表格保留表头、行列跨度及基本单元格内容；没有专用的增删行列操作。
- 导入链接仅渲染 HTTP、HTTPS、mailto、tel 与相对地址；可执行协议以普通文字显示。

## 开发与验证

```sh
pnpm run typecheck
pnpm test
pnpm run build:consumer

# 首次使用 Playwright 时安装其 Chromium
pnpm exec playwright install chromium
pnpm run test:browser

# macOS 也可直接复用已安装的 Chrome
SLATE_BROWSER_CHANNEL=chrome pnpm run test:browser
```

`examples/consumer.tsx` 通过构建后的 `dist/index.js` 消费包，使用合成文档验证输入、保存回调、只读、`key` 换文档、多个编辑器隔离和表单嵌入，不上传内容或接入站点统计。组件库不自行接入网站分析；由宿主应用决定统计策略。

本地查看消费者：

```sh
python3 -m http.server 4406 --bind 127.0.0.1 --directory artifacts/consumer
```

追加 `?rich=1` 可查看公式、引用、标题、表头和从 0 开始的列表。浏览器回归测试使用自己的临时端口；桌面/手机截图生成在 `artifacts/consumer/`，不会提交进仓库。

2026-10-06 审查修复包括：引用/公式/标题转换、空文本输出、初始值引起的重复保存、只读元素修改、加号/斜杠菜单、最后一块删除、块移动和复制、表头与零序号渲染、链接协议校验及手机工具栏换行。转换与浏览器验证脚本随仓库提供。

## 许可证

MIT，见 LICENSE。
