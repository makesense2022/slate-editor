/**
 * 引用块元素组件
 * @param {Object} props - 组件属性
 * @param {Object} props.attributes - Slate 传递的属性
 * @param {Object} props.element - 引用元素数据
 * @param {React.ReactNode} props.children - 子元素
 */
export function QuoteElement({ attributes, element, children }) {
  return (
    <blockquote
      {...attributes}
      style={{
        margin: '8px 0',
        padding: '12px 16px',
        borderLeft: '4px solid #007AFF',
        backgroundColor: '#f8f9fa',
        borderRadius: '0 6px 6px 0',
        fontStyle: 'italic',
        color: '#555',
        position: 'relative',
        minHeight: '1.5em',
        whiteSpace: 'pre-wrap',
      }}
    >
      {children}
    </blockquote>
  );
}
