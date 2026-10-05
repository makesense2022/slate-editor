/**
 * 数据转换器 - 在 ProseMirror/TipTap JSON 格式和 Slate.js 格式之间转换
 */

/**
 * 将后端的 ProseMirror 格式转换为 Slate.js 格式
 * @param {Object} proseMirrorDoc - ProseMirror 文档对象
 * @returns {Array} Slate.js 格式的文档
 */
export function proseMirrorToSlate(proseMirrorDoc) {
  if (!proseMirrorDoc || !Array.isArray(proseMirrorDoc.content)) {
    return [{ type: 'paragraph', children: [{ text: '' }] }];
  }

  const result = [];
  proseMirrorDoc.content.forEach(node => {
    const converted = convertProseMirrorNode(node);
    if (Array.isArray(converted)) {
      // 扁平化处理嵌套数组
      const flattenArray = (arr) => {
        const flattened = [];
        arr.forEach(item => {
          if (Array.isArray(item)) {
            flattened.push(...flattenArray(item));
          } else {
            flattened.push(item);
          }
        });
        return flattened;
      };
      result.push(...flattenArray(converted));
    } else {
      result.push(converted);
    }
  });
  
  return result.length ? result : [{ type: 'paragraph', children: [{ text: '' }] }];
}

/**
 * 将 Slate.js 格式转换为后端的 ProseMirror 格式
 * @param {Array} slateNodes - Slate.js 节点数组
 * @returns {Object} ProseMirror 文档对象
 */
export function slateToProseMirror(slateNodes) {
  const content = [];
  let currentBulletList = null;
  let currentOrderedList = null;
  
  slateNodes.forEach(node => {
    if (node.type === 'bulleted-list') {
      currentOrderedList = null;
      if (!currentBulletList) {
        currentBulletList = {
          type: 'bulletList',
          attrs: { tight: true },
          content: []
        };
        content.push(currentBulletList);
      }
      currentBulletList.content.push(convertSlateNode(node));
    } else if (node.type === 'numbered-list') {
      currentBulletList = null;
      if (!currentOrderedList) {
        currentOrderedList = {
          type: 'orderedList',
          attrs: { tight: false, start: Number.isInteger(node.listNumber) ? node.listNumber : 1 },
          content: []
        };
        content.push(currentOrderedList);
      }
      currentOrderedList.content.push(convertSlateNode(node));
    } else {
      // 如果遇到其他类型的节点，结束当前的列表
      currentBulletList = null;
      currentOrderedList = null;
      content.push(convertSlateNode(node));
    }
  });
  
  return {
    type: "doc",
    content
  };
}

/**
 * 转换单个 ProseMirror 节点为 Slate.js 节点
 * @param {Object} node - ProseMirror 节点
 * @returns {Object} Slate.js 节点
 */
function convertProseMirrorNode(node) {
  switch (node.type) {
    case 'horizontalRule':
      return {
        type: 'divider',
        children: [{ text: '' }]
      };

    case 'heading':
      return {
        type: `heading-${getHeadingLevel(node.attrs?.level)}`,
        children: convertProseMirrorContent(node.content || [])
      };

    case 'paragraph':
      return {
        type: 'paragraph',
        children: convertProseMirrorContent(node.content || [{ text: '' }])
      };

    case 'bulletList':
      const bulletItems = [];
      node.content?.forEach(listItem => {
        // 处理列表项内容
        if (listItem.content && listItem.content.length > 0) {
          listItem.content.forEach(itemContent => {
            if (itemContent.type === 'paragraph') {
              // 主列表项
              bulletItems.push({
                type: 'bulleted-list',
                children: convertProseMirrorContent(itemContent.content || [{ text: '' }])
              });
            } else if (itemContent.type === 'bulletList') {
              // 嵌套无序列表
              itemContent.content?.forEach(nestedListItem => {
                bulletItems.push({
                  type: 'bulleted-list',
                  indent: 1,
                  children: convertProseMirrorContent(nestedListItem.content?.[0]?.content || [{ text: '' }])
                });
              });
            } else if (itemContent.type === 'orderedList') {
              // 嵌套有序列表
              itemContent.content?.forEach((nestedListItem, index) => {
                bulletItems.push({
                  type: 'numbered-list',
                  listNumber: index + 1,
                  indent: 1,
                  children: convertProseMirrorContent(nestedListItem.content?.[0]?.content || [{ text: '' }])
                });
              });
            }
          });
        } else {
          bulletItems.push({
            type: 'bulleted-list',
            children: [{ text: '' }]
          });
        }
      });
      return bulletItems;

    case 'orderedList':
      const orderedItems = [];
      const startNumber = node.attrs?.start ?? 1;
      node.content?.forEach((listItem, mainIndex) => {
        // 处理列表项内容
        if (listItem.content && listItem.content.length > 0) {
          listItem.content.forEach(itemContent => {
            if (itemContent.type === 'paragraph') {
              // 主列表项
              orderedItems.push({
                type: 'numbered-list',
                listNumber: startNumber + mainIndex,
                children: convertProseMirrorContent(itemContent.content || [{ text: '' }])
              });
            } else if (itemContent.type === 'bulletList') {
              // 嵌套无序列表
              itemContent.content?.forEach(nestedListItem => {
                orderedItems.push({
                  type: 'bulleted-list',
                  indent: 1,
                  children: convertProseMirrorContent(nestedListItem.content?.[0]?.content || [{ text: '' }])
                });
              });
            } else if (itemContent.type === 'orderedList') {
              // 嵌套有序列表
              itemContent.content?.forEach((nestedListItem, index) => {
                orderedItems.push({
                  type: 'numbered-list',
                  listNumber: index + 1,
                  indent: 1,
                  children: convertProseMirrorContent(nestedListItem.content?.[0]?.content || [{ text: '' }])
                });
              });
            }
          });
        } else {
          orderedItems.push({
            type: 'numbered-list',
            listNumber: startNumber + mainIndex,
            children: [{ text: '' }]
          });
        }
      });
      return orderedItems;

    case 'image':
      return {
        type: 'image',
        url: node.attrs?.src || '',
        alt: node.attrs?.alt || '',
        align: node.attrs?.align || 'left',
        children: [{ text: '' }]
      };

    case 'codeBlock':
      return {
        type: 'code-block',
        language: node.attrs?.language || 'javascript',
        children: convertProseMirrorContent(node.content || [{ text: '' }])
      };

    case 'blockquote':
      return {
        type: 'quote',
        children: convertTableCellContent(node.content || [])
      };

    case 'mathNode':
      return {
        type: 'math-inline',
        latex: node.attrs?.latex || '',
        displayMode: node.attrs?.displayMode || false,
        children: [{ text: '' }]
      };

    case 'table':
      return {
        type: 'table',
        children: node.content ? node.content.map(convertProseMirrorNode).flat() : []
      };

    case 'tableRow':
      return {
        type: 'table-row',
        children: node.content ? node.content.map(convertProseMirrorNode).flat() : []
      };

    case 'tableHeader':
      return {
        type: 'table-header',
        attrs: node.attrs || {},
        children: convertTableCellContent(node.content || [])
      };

    case 'tableCell':
      return {
        type: 'table-cell',
        attrs: node.attrs || {},
        children: convertTableCellContent(node.content || [])
      };

    default:
      // 默认转换为段落
      return {
        type: 'paragraph',
        children: convertProseMirrorContent(node.content || [{ text: '' }])
      };
  }
}

/**
 * 转换表格单元格内容
 * @param {Array} content - 表格单元格的 ProseMirror 内容数组
 * @returns {Array} Slate.js 节点数组
 */
function convertTableCellContent(content) {
  if (!content || content.length === 0) {
    return [{ text: '' }];
  }

  const result = [];
  
  content.forEach(item => {
    if (item.type === 'paragraph') {
      if (result.length) result.push({ text: '\n' });
      // 对于段落，提取其内容并转换为内联元素
      const paragraphContent = convertProseMirrorContent(item.content || []);
      result.push(...paragraphContent);
    } else if (['text', 'hardBreak', 'mathNode'].includes(item.type)) {
      result.push(...convertProseMirrorContent([item]));
    } else {
      // 对于其他类型的内容，使用标准转换
      const converted = convertProseMirrorNode(item);
      if (Array.isArray(converted)) {
        result.push(...converted);
      } else {
        result.push(converted);
      }
    }
  });

  return result.length > 0 ? result : [{ text: '' }];
}

/**
 * 转换 ProseMirror 内容数组
 * @param {Array} content - ProseMirror 内容数组
 * @returns {Array} Slate.js 文本节点数组
 */
function convertProseMirrorContent(content) {
  if (!content || content.length === 0) {
    return [{ text: '' }];
  }

  return content.map(item => {
    if (item.type === 'text') {
      const textNode = { text: item.text || '' };
      
      // 处理文本标记
      if (item.marks) {
        item.marks.forEach(mark => {
          switch (mark.type) {
            case 'bold':
              textNode.bold = true;
              break;
            case 'italic':
              textNode.italic = true;
              break;
            case 'code':
              textNode.code = true;
              break;
            case 'link':
              textNode.link = true;
              textNode.url = mark.attrs?.href || '';
              break;
          }
        });
      }
      
      return textNode;
    } else if (item.type === 'hardBreak') {
      return { text: '\n' };
    } else if (item.type === 'mathNode') {
      return {
        type: 'math-inline',
        latex: item.attrs?.latex || '',
        displayMode: item.attrs?.displayMode || false,
        children: [{ text: '' }]
      };
    } else {
      return { text: item.text || '' };
    }
  });
}

/**
 * 转换单个 Slate.js 节点为 ProseMirror 节点
 * @param {Object} node - Slate.js 节点
 * @returns {Object} ProseMirror 节点
 */
function convertSlateNode(node) {
  switch (node.type) {
    case 'divider':
      return { type: 'horizontalRule' };

    case 'heading-one':
      return {
        type: 'heading',
        attrs: { level: 1 },
        content: convertSlateContent(node.children)
      };

    case 'heading-two':
      return {
        type: 'heading',
        attrs: { level: 2 },
        content: convertSlateContent(node.children)
      };

    case 'heading-three':
      return {
        type: 'heading',
        attrs: { level: 3 },
        content: convertSlateContent(node.children)
      };

    case 'heading-four':
    case 'heading-five':
    case 'heading-six':
      return {
        type: 'heading',
        attrs: { level: ['four', 'five', 'six'].indexOf(node.type.slice(8)) + 4 },
        content: convertSlateContent(node.children)
      };

    case 'bulleted-list':
      return {
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: convertSlateContent(node.children)
        }]
      };

    case 'numbered-list':
      return {
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: convertSlateContent(node.children)
        }]
      };

    case 'image':
      return {
        type: 'image',
        attrs: {
          src: node.url || '',
          alt: node.alt || '',
          align: node.align || 'center'
        }
      };

    case 'math-inline':
      return {
        type: 'mathNode',
        attrs: {
          latex: node.latex || '',
          displayMode: node.displayMode || false
        }
      };

    case 'table':
      return {
        type: 'table',
        content: node.children.map(convertSlateNode)
      };

    case 'table-row':
      return {
        type: 'tableRow',
        content: node.children.map(convertSlateNode)
      };

    case 'table-header':
      return {
        type: 'tableHeader',
        attrs: node.attrs || {},
        content: [{
          type: 'paragraph',
          content: convertSlateContent(node.children)
        }]
      };

    case 'table-cell':
      return {
        type: 'tableCell',
        attrs: node.attrs || {},
        content: [{
          type: 'paragraph',
          content: convertSlateContent(node.children)
        }]
      };

    case 'code-block':
      return {
        type: 'codeBlock',
        attrs: { language: node.language || 'javascript' },
        content: convertSlateContent(node.children, false)
      };

    case 'quote':
      return {
        type: 'blockquote',
        content: [{ type: 'paragraph', content: convertSlateContent(node.children) }]
      };

    case 'formula-block':
      // 自定义的数学公式块，转换为段落并标记
      return {
        type: 'paragraph',
        content: [{
          type: 'text',
          text: `$$${node.latex || 'E = mc^2'}$$`
        }]
      };

    case 'todo-list':
      return {
        type: 'bulletList',
        attrs: { tight: true },
        content: [{
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [
              { type: 'text', text: node.checked ? '☑️ ' : '☐ ' },
              ...convertSlateContent(node.children)
            ]
          }]
        }]
      };

    default:
      return {
        type: 'paragraph',
        content: convertSlateContent(node.children || [{ text: '' }])
      };
  }
}

/**
 * 转换 Slate.js 内容数组
 * @param {Array} children - Slate.js 子节点数组
 * @returns {Array} ProseMirror 内容数组
 */
function convertSlateContent(children, convertLineBreaks = true) {
  if (!children || children.length === 0) {
    return [];
  }

  return children.flatMap(child => {
    if (child.text !== undefined) {
      // ProseMirror disallows empty text nodes; empty blocks use content: [].
      if (!child.text) return [];
      const textNode = {
        type: 'text',
        text: child.text
      };

      // 处理文本标记
      const marks = [];
      if (child.bold) marks.push({ type: 'bold' });
      if (child.italic) marks.push({ type: 'italic' });
      if (child.code) marks.push({ type: 'code' });
      if (child.link) {
        marks.push({
          type: 'link',
          attrs: { href: child.url || '' }
        });
      }

      if (marks.length > 0) {
        textNode.marks = marks;
      }

      if (!convertLineBreaks) return [textNode];
      return child.text.split('\n').flatMap((text, index) => [
        ...(index ? [{ type: 'hardBreak' }] : []),
        ...(text ? [{ ...textNode, text }] : [])
      ]);
    }

    if (child.type === 'math-inline') return [convertSlateNode(child)];
    return [];
  });
}

/**
 * 获取标题级别对应的字符串
 * @param {number} level - 标题级别
 * @returns {string} 标题级别字符串
 */
function getHeadingLevel(level) {
  switch (level) {
    case 1: return 'one';
    case 2: return 'two';
    case 3: return 'three';
    case 4: return 'four';
    case 5: return 'five';
    case 6: return 'six';
    default: return 'one';
  }
}
