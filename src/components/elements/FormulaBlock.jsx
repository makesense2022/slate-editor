import { useMemo } from 'react';
import { useFocused, useSelected, ReactEditor } from 'slate-react';
import { Transforms } from 'slate';
import katex from 'katex';
// 注意：需要在 root.tsx 或 app.css 中导入 KaTeX CSS
// import 'katex/dist/katex.min.css';

/**
 * LaTeX 公式块组件
 * @param {Object} props - 组件属性
 * @param {Object} props.attributes - Slate 传递的属性
 * @param {Object} props.element - 公式元素数据
 * @param {React.ReactNode} props.children - 子元素
 * @param {Object} props.editor - Slate 编辑器实例
 */
export function FormulaBlock({ attributes, element, children, editor }) {
  const selected = useSelected();
  const focused = useFocused();

  // 使用 useMemo 缓存渲染后的 LaTeX 公式，避免重复计算
  const renderedFormula = useMemo(() => {
    try {
      // 使用 KaTeX 将 LaTeX 字符串渲染为 HTML
      return katex.renderToString(element.latex || 'E = mc^2', {
        displayMode: true, // 块级显示模式
        throwOnError: false, // 遇到错误时不抛出异常
        errorColor: '#cc0000', // 错误时的颜色
      });
    } catch (error) {
      console.error('KaTeX 渲染错误:', error);
      return '<span style="color: #cc0000;">公式渲染错误</span>';
    }
  }, [element.latex]);

  // 处理双击事件，打开编辑对话框
  const handleDoubleClick = () => {
    const currentLatex = element.latex || '';
    const newLatex = prompt('请输入 LaTeX 公式:', currentLatex);
    
    if (newLatex !== null && newLatex !== currentLatex) {
      // 找到当前元素的路径
      const path = ReactEditor.findPath(editor, element);
      
      // 更新元素的 latex 属性
      Transforms.setNodes(
        editor,
        { latex: newLatex },
        { at: path }
      );
    }
  };

  return (
    <div {...attributes}>
      <div
        contentEditable={false}
        className={`formula-container ${
          selected && focused ? 'formula-selected' : ''
        }`}
        onDoubleClick={handleDoubleClick}
        style={{
          padding: '12px 16px',
          margin: '8px 0',
          backgroundColor: '#f8f9fa',
          border: selected && focused ? '2px solid #007AFF' : '1px solid #e1e5e9',
          borderRadius: '6px',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'border-color 0.2s ease, background-color 0.2s ease',
          position: 'relative',
        }}
        title="双击编辑公式"
      >
        {/* 渲染 KaTeX 生成的 HTML */}
        <div
          dangerouslySetInnerHTML={{ __html: renderedFormula }}
          style={{ 
            minHeight: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
        
        {/* 显示原始 LaTeX 代码的提示 */}
        {selected && focused && (
          <div
            style={{
              position: 'absolute',
              top: '-24px',
              left: '0',
              fontSize: '12px',
              color: '#666',
              backgroundColor: '#fff',
              padding: '2px 6px',
              borderRadius: '3px',
              border: '1px solid #ddd',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            LaTeX: {element.latex || 'E = mc^2'}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
