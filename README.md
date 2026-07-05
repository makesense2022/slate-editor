# Slate Editor

一个基于 Slate.js 的强大富文本编辑器，具有 Notion 风格的功能。

## 功能特性

- ✅ **Notion 风格界面**：现代化的块级编辑器界面
- ✅ **只读模式**：支持 Markdown 查看器模式
- ✅ **数学公式**：支持 KaTeX 渲染的数学公式
- ✅ **表格支持**：完整的表格渲染和编辑
- ✅ **列表支持**：有序列表、无序列表、嵌套列表
- ✅ **多种块类型**：标题、段落、引用、代码块、图片、分割线等
- ✅ **数据转换**：支持 ProseMirror/TipTap JSON 格式
- ✅ **TypeScript 支持**：完整的类型定义

## 快速开始

### 安装

```bash
pnpm add @makesense2022/slate-editor
```

### 基本使用

```tsx
import { EditorComponent } from '@makesense2022/slate-editor';

function App() {
  return (
    <EditorComponent
      initialData={yourData}
      readOnly={false}
      onSave={(data) => console.log('保存:', data)}
    />
  );
}
```

### 只读模式

```tsx
<EditorComponent
  initialData={yourData}
  readOnly={true}
  showToolbar={false}
  showBlockControls={false}
/>
```

## API

### EditorComponent Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `initialData` | `any` | `undefined` | 初始数据（ProseMirror 格式） |
| `readOnly` | `boolean` | `false` | 是否为只读模式 |
| `showToolbar` | `boolean` | `true` | 是否显示工具栏 |
| `showBlockControls` | `boolean` | `true` | 是否显示块级控制按钮 |
| `onSave` | `(data: any) => void` | `undefined` | 保存回调函数 |

## 开发

### 本地开发

```bash
# 安装依赖
pnpm install

# 类型检查
pnpm typecheck
```

### 项目结构

```
src/
├── components/
│   ├── EditorComponent.tsx    # 主编辑器组件
│   ├── elements/              # 元素组件
│   │   ├── BlockWrapper.tsx
│   │   ├── ListElement.tsx
│   │   ├── MathElement.tsx
│   │   └── ...
│   └── menus/                 # 菜单组件
│       ├── SlashMenu.tsx
│       ├── BlockMenu.tsx
│       └── Toolbar.tsx
├── hooks/
│   └── useDebounce.ts
├── utils/
│   └── dataConverter.ts
└── index.ts                   # 主入口文件
```

## 许可证

MIT
