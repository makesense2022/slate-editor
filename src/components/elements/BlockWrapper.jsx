import { useState, useRef, useEffect } from 'react';
import { Transforms, Editor, Range } from 'slate';
import { ReactEditor, useSlate, useFocused, useSelected } from 'slate-react';
import { BlockMenu } from '../menus/BlockMenu.js';

/**
 * 块容器组件 - 为每个块提供选择、操作等功能
 * @param {Object} props - 组件属性
 * @param {Object} props.element - 块元素
 * @param {React.ReactNode} props.children - 子元素
 * @param {Object} props.attributes - Slate 属性
 * @param {boolean} [props.readOnly] - 是否为只读模式
 * @param {boolean} [props.showControls] - 是否显示控制按钮
 */
export function BlockWrapper({ element, children, attributes, readOnly = false, showControls = true }) {
  const editor = useSlate();
  const selected = useSelected();
  const focused = useFocused();
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const blockRef = useRef(null);

  // 获取块路径
  const getBlockPath = () => {
    try {
      return ReactEditor.findPath(editor, element);
    } catch (error) {
      console.error('获取块路径失败:', error);
      return null;
    }
  };


  // 处理加号按钮点击 - 在下面增加一行并唤起斜杠菜单
  const handlePlusButtonClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const path = getBlockPath();
      if (path) {
        // 在当前块下面插入一个新的段落
        const newParagraph = {
          type: 'paragraph',
          children: [{ text: '' }]
        };
        
        Transforms.insertNodes(editor, newParagraph, {
          at: [path[0] + 1]
        });

        // 移动光标到新段落
        const newPath = [path[0] + 1, 0];
        Transforms.select(editor, {
          anchor: { path: newPath, offset: 0 },
          focus: { path: newPath, offset: 0 }
        });

        // 触发斜杠菜单 - 通过自定义事件通知编辑器
        const slashEvent = new CustomEvent('triggerSlashMenu', {
          detail: { editor, path: newPath }
        });
        document.dispatchEvent(slashEvent);
      }
    } catch (error) {
      console.error('添加新行时出错:', error);
    }
  };

  // 处理拖拽手柄点击 - 选中当前行并弹出 BlockMenu
  const handleDragHandleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const path = getBlockPath();
      if (path) {
        // 聚焦编辑器
        ReactEditor.focus(editor);
        
        // 对于 void 元素，直接选中整个节点
        if (editor.isVoid(element)) {
          Transforms.select(editor, path);
        } else {
          // 对于非 void 元素，选中从开始到结束的整个内容
          const start = Editor.start(editor, path);
          const end = Editor.end(editor, path);
          
          Transforms.select(editor, {
            anchor: start,
            focus: end
          });
        }

        // 弹出 BlockMenu
        const rect = event.currentTarget.getBoundingClientRect();
        setMenuPosition({
          x: rect.left - 280, // 菜单宽度为 280px
          y: rect.top,
        });
        setShowMenu(true);
      }
    } catch (error) {
      console.error('选择块时出错:', error);
    }
  };

  // 关闭菜单
  const handleCloseMenu = () => {
    setShowMenu(false);
  };


  // 检查是否是 void 元素
  const isVoid = editor.isVoid(element);
  
  // 检查是否是嵌套列表项（缩进级别大于0）
  const isNestedListItem = (element.type === 'bulleted-list' || element.type === 'numbered-list') && element.indent > 0;

  // 检查块是否被选中（整个块被选中）
  const isBlockSelected = (() => {
    if (!selected || !focused || !editor.selection) return false;
    
    try {
      const path = getBlockPath();
      if (!path) return false;
      
      const blockText = Editor.string(editor, path);
      const selectedText = Editor.string(editor, editor.selection);
      
      // 如果选中的文本等于整个块的文本，说明整个块被选中
      return blockText === selectedText && blockText.length > 0;
    } catch (error) {
      return selected && focused;
    }
  })();

  return (
    <>
      <div
        ref={blockRef}
        {...attributes}
        className={`block-wrapper ${isBlockSelected ? 'selected' : ''}`}
        style={{
          position: 'relative',
          margin: '2px 0',
          marginLeft: '50px', // 为左侧按钮留出空间
          borderRadius: '3px',
          transition: 'all 0.2s ease',
          backgroundColor: isBlockSelected ? '#e6f3ff' : (isHovered ? '#f8f9fa' : 'transparent'),
          border: '1px solid transparent',
          boxShadow: isBlockSelected ? '0 0 0 1px #007AFF' : 'none',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 拖拽手柄和块级操作按钮容器 - 嵌套列表项、只读模式或禁用控制时不显示 */}
        {!isNestedListItem && !readOnly && showControls && (
          <div
            contentEditable={false}
            style={{
              position: 'absolute',
              left: '-48px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              zIndex: 10,
              opacity: (isHovered || isBlockSelected) ? 1 : 0,
              transition: 'opacity 0.2s ease',
              padding: '2px', // 增加一些内边距来扩大悬停区域
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >

            {/* 加号按钮 - 添加新行 */}
            <div
              className="plus-button"
              onClick={handlePlusButtonClick}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '3px',
                backgroundColor: '#f1f3f4',
                border: '1px solid #dadce0',
                fontSize: '12px',
                color: '#5f6368',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e8eaed';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f1f3f4';
              }}
              title="添加新行"
            >
              +
            </div>
            {/* 拖拽手柄 - 选中并显示菜单 */}
            <div
              className="drag-handle"
              onClick={handleDragHandleClick}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '3px',
                backgroundColor: '#f1f3f4',
                border: '1px solid #dadce0',
                fontSize: '12px',
                color: '#5f6368',
                transition: 'all 0.2s ease',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.cursor = 'grabbing';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.cursor = 'grab';
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e8eaed';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f1f3f4';
              }}
              title="选中块并显示菜单"
            >
              ⋮⋮
            </div>
          </div>
        )}

        {/* 块内容 */}
        <div
          style={{
            padding: isVoid ? '0' : '4px 8px',
            minHeight: '1.5em',
            position: 'relative',
          }}
        >
          {children}
        </div>

        {/* 选中状态指示器 */}
        {isBlockSelected && (
          <div
            style={{
              position: 'absolute',
              left: '-8px',
              top: '0',
              bottom: '0',
              width: '3px',
              backgroundColor: '#007AFF',
              borderRadius: '2px',
            }}
          />
        )}
      </div>

      {/* 块级操作菜单 */}
      {!readOnly && showControls && <BlockMenu
        isOpen={showMenu}
        onClose={handleCloseMenu}
        blockPath={getBlockPath()}
        position={menuPosition}
      />}
    </>
  );
}
