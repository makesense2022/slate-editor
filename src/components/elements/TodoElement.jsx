import { Transforms } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';

/**
 * 待办事项元素组件
 * @param {Object} props - 组件属性
 * @param {Object} props.attributes - Slate 传递的属性
 * @param {Object} props.element - 待办事项元素数据
 * @param {React.ReactNode} props.children - 子元素
 */
export function TodoElement({ attributes, element, children }) {
  const editor = useSlate();

  // 切换完成状态
  const toggleChecked = () => {
    try {
      const path = ReactEditor.findPath(editor, element);
      Transforms.setNodes(
        editor,
        { checked: !element.checked },
        { at: path }
      );
    } catch (error) {
      console.error('切换待办状态时出错:', error);
    }
  };

  return (
    <div {...attributes} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      <div
        contentEditable={false}
        onClick={toggleChecked}
        style={{
          marginTop: '2px',
          cursor: 'pointer',
          userSelect: 'none',
          fontSize: '16px',
          color: element.checked ? '#007AFF' : '#ccc',
          transition: 'color 0.2s ease',
        }}
      >
        {element.checked ? '☑️' : '☐'}
      </div>
      <div
        style={{
          flex: 1,
          textDecoration: element.checked ? 'line-through' : 'none',
          color: element.checked ? '#999' : 'inherit',
          transition: 'all 0.2s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}
