import React from 'react';

/**
 * 表格元素组件
 * @param {Object} props - 组件属性
 * @param {Object} props.attributes - Slate 传递的属性
 * @param {Object} props.element - 表格元素数据
 * @param {React.ReactNode} props.children - 子元素
 */
export function TableElement({ attributes, element, children }) {
  return (
    <div {...attributes} style={{ margin: '16px 0', overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #e1e5e9',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 表格行元素组件
 * @param {Object} props - 组件属性
 * @param {Object} props.attributes - Slate 传递的属性
 * @param {Object} props.element - 表格行元素数据
 * @param {React.ReactNode} props.children - 子元素
 */
export function TableRowElement({ attributes, element, children }) {
  return (
    <tr
      {...attributes}
      style={{
        borderBottom: '1px solid #e1e5e9',
      }}
    >
      {children}
    </tr>
  );
}

/**
 * 表格单元格元素组件（包括表头和普通单元格）
 * @param {Object} props - 组件属性
 * @param {Object} props.attributes - Slate 传递的属性
 * @param {Object} props.element - 表格单元格元素数据
 * @param {React.ReactNode} props.children - 子元素
 */
export function TableCellElement({ attributes, element, children }) {
  const isHeader = element.type === 'table-header' || element.type === 'tableHeader';
  const TagName = isHeader ? 'th' : 'td';
  
  const cellStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    verticalAlign: 'top',
    border: '1px solid #e1e5e9',
    backgroundColor: isHeader ? '#f8f9fa' : 'transparent',
    fontWeight: isHeader ? '600' : 'normal',
    fontSize: isHeader ? '14px' : '14px',
    color: isHeader ? '#495057' : '#333',
    minWidth: '100px',
  };

  // 处理 colspan 和 rowspan
  const cellProps = {
    ...attributes,
    style: cellStyle,
  };

  if (element.attrs?.colspan && element.attrs.colspan > 1) {
    cellProps.colSpan = element.attrs.colspan;
  }
  
  if (element.attrs?.rowspan && element.attrs.rowspan > 1) {
    cellProps.rowSpan = element.attrs.rowspan;
  }

  return (
    <TagName {...cellProps}>
      {children}
    </TagName>
  );
}
