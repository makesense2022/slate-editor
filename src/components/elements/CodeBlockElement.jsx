/**
 * 代码块元素组件
 * @param {Object} props - 组件属性
 * @param {Object} props.attributes - Slate 传递的属性
 * @param {Object} props.element - 代码块元素数据
 * @param {React.ReactNode} props.children - 子元素
 */
export function CodeBlockElement({ attributes, element, children }) {
  return (
    <div {...attributes} style={{ margin: '8px 0' }}>
      <div
        style={{
          backgroundColor: '#f6f8fa',
          border: '1px solid #e1e4e8',
          borderRadius: '6px',
          padding: '16px',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          fontSize: '14px',
          lineHeight: '1.45',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {/* 语言标签 */}
        {element.language && (
          <div
            contentEditable={false}
            style={{
              position: 'absolute',
              top: '8px',
              right: '12px',
              fontSize: '12px',
              color: '#586069',
              backgroundColor: '#f1f3f4',
              padding: '2px 6px',
              borderRadius: '3px',
              userSelect: 'none',
            }}
          >
            {element.language}
          </div>
        )}
        <code 
          style={{ 
            whiteSpace: 'pre-wrap',
            display: 'block',
            minHeight: '1.5em',
          }}
        >
          {children}
        </code>
      </div>
    </div>
  );
}
