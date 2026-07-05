import { useFocused, useSelected } from 'slate-react';

/**
 * 图片元素组件
 * @param {Object} props - 组件属性
 * @param {Object} props.attributes - Slate 传递的属性
 * @param {Object} props.element - 图片元素数据
 * @param {React.ReactNode} props.children - 子元素
 */
export function ImageElement({ attributes, element, children }) {
  const selected = useSelected();
  const focused = useFocused();

  return (
    <div {...attributes}>
      <div
        contentEditable={false}
        className={`image-container ${
          selected && focused ? 'image-selected' : ''
        }`}
        style={{
          display: 'inline-block',
          maxWidth: '100%',
          position: 'relative',
        }}
      >
        <img
          src={element.url}
          alt="编辑器图片"
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '4px',
            border: selected && focused ? '2px solid #007AFF' : '1px solid #e1e5e9',
            transition: 'border-color 0.2s ease',
          }}
        />
      </div>
      {children}
    </div>
  );
}
