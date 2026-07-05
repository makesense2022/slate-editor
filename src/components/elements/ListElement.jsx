import React from 'react';

/**
 * 列表项元素组件
 * @param {Object} props - 组件属性
 * @param {Object} props.attributes - Slate 传递的属性
 * @param {Object} props.element - 列表元素数据
 * @param {React.ReactNode} props.children - 子元素
 */
export function ListElement({ attributes, element, children }) {
  const isNumbered = element.type === 'numbered-list';
  const listNumber = element.listNumber || 1;
  
  // 检查是否有嵌套的列表项（用于缩进）
  const hasNestedList = React.Children.toArray(children).some(child => 
    React.isValidElement(child) && 
    (child.props?.element?.type === 'bulleted-list' || 
     child.props?.element?.type === 'numbered-list')
  );
  
  // 计算缩进级别（简单实现，可以根据需要扩展）
  const indentLevel = element.indent || 0;
  const paddingLeft = indentLevel * 24;
  
  return (
    <div 
      {...attributes} 
      style={{ 
        display: 'flex',
        alignItems: 'flex-start',
        margin: '2px 0', 
        lineHeight: '1.6',
        paddingLeft: `${paddingLeft}px`
      }}
    >
      <span style={{ 
        minWidth: '24px',
        marginRight: '8px',
        fontWeight: 'normal',
        color: '#666',
        fontSize: '14px',
        flexShrink: 0
      }}>
        {isNumbered ? `${listNumber}.` : '•'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}
