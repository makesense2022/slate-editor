import { Editor, Transforms } from 'slate';
import { useSlate } from 'slate-react';

/**
 * 工具栏组件
 */
export function Toolbar() {
  const editor = useSlate();

  // 切换粗体格式
  const toggleBold = () => {
    const isActive = isMarkActive(editor, 'bold');
    if (isActive) {
      Editor.removeMark(editor, 'bold');
    } else {
      Editor.addMark(editor, 'bold', true);
    }
  };

  // 插入图片块
  const insertImage = () => {
    const url = prompt('请输入图片 URL:', 'https://via.placeholder.com/400x200?text=示例图片');
    if (url) {
      const imageElement = {
        type: 'image',
        url,
        children: [{ text: '' }],
      };
      Transforms.insertNodes(editor, imageElement);
    }
  };

  // 插入公式块
  const insertFormula = () => {
    const latex = prompt('请输入 LaTeX 公式:', 'E = mc^2');
    if (latex !== null) {
      const formulaElement = {
        type: 'formula-block',
        latex: latex || 'E = mc^2',
        children: [{ text: '' }],
      };
      Transforms.insertNodes(editor, formulaElement);
    }
  };

  // 检查当前选中文本是否有指定标记
  const isMarkActive = (editor, format) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
  };

  return (
    <div
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid #e1e5e9',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}
    >
      {/* 粗体按钮 */}
      <button
        onMouseDown={(event) => {
          event.preventDefault();
          toggleBold();
        }}
        style={{
          padding: '6px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: isMarkActive(editor, 'bold') ? '#007AFF' : '#fff',
          color: isMarkActive(editor, 'bold') ? '#fff' : '#333',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: isMarkActive(editor, 'bold') ? 'bold' : 'normal',
          transition: 'all 0.2s ease',
        }}
        title="粗体 (Ctrl+B)"
      >
        <strong>B</strong>
      </button>

      {/* 分隔线 */}
      <div
        style={{
          width: '1px',
          height: '24px',
          backgroundColor: '#ddd',
          margin: '0 4px',
        }}
      />

      {/* 插入图片按钮 */}
      <button
        onMouseDown={(event) => {
          event.preventDefault();
          insertImage();
        }}
        style={{
          padding: '6px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#fff',
          color: '#333',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'all 0.2s ease',
        }}
        title="插入图片"
      >
        🖼️ 图片
      </button>

      {/* 插入公式按钮 */}
      <button
        onMouseDown={(event) => {
          event.preventDefault();
          insertFormula();
        }}
        style={{
          padding: '6px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#fff',
          color: '#333',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'all 0.2s ease',
        }}
        title="插入数学公式"
      >
        🧮 公式
      </button>

      {/* 快速插入按钮 */}
      <button
        onMouseDown={(event) => {
          event.preventDefault();
          const todoElement = {
            type: 'todo-list',
            checked: false,
            children: [{ text: '新待办事项' }],
          };
          Transforms.insertNodes(editor, todoElement);
        }}
        style={{
          padding: '6px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#fff',
          color: '#333',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'all 0.2s ease',
        }}
        title="插入待办事项"
      >
        ☐ 待办
      </button>

      <button
        onMouseDown={(event) => {
          event.preventDefault();
          const quoteElement = {
            type: 'quote',
            children: [{ text: '引用内容' }],
          };
          Transforms.insertNodes(editor, quoteElement);
        }}
        style={{
          padding: '6px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#fff',
          color: '#333',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'all 0.2s ease',
        }}
        title="插入引用"
      >
        ❝ 引用
      </button>

      {/* 格式提示 */}
      <div
        style={{
          marginLeft: 'auto',
          fontSize: '12px',
          color: '#666',
        }}
      >
        点击左侧 + 按钮或使用快捷键操作块
      </div>
    </div>
  );
}
