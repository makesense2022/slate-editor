/**
 * 分割线元素组件
 * @param {Object} props - 组件属性
 * @param {Object} props.attributes - Slate 传递的属性
 * @param {Object} props.element - 分割线元素数据
 * @param {React.ReactNode} props.children - 子元素
 */
export function DividerElement({ attributes, element, children }) {
  return (
    <div {...attributes} style={{ margin: '16px 0' }}>
      <div
        contentEditable={false}
        style={{
          height: '1px',
          backgroundColor: '#e1e5e9',
          width: '100%',
          position: 'relative',
        }}
      />
      {children}
    </div>
  );
}
