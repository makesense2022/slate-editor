import { useState, useEffect, useRef } from 'react';
import { Editor, Transforms, Element as SlateElement } from 'slate';
import { useSlate } from 'slate-react';

/**
 * 块级操作菜单组件
 * @param {Object} props - 组件属性
 * @param {boolean} props.isOpen - 菜单是否打开
 * @param {Function} props.onClose - 关闭菜单回调
 * @param {Array} props.blockPath - 当前块的路径
 * @param {Object} props.position - 菜单位置
 */
export function BlockMenu({ isOpen, onClose, blockPath, position }) {
  const editor = useSlate();
  const [searchTerm, setSearchTerm] = useState('');
  const menuRef = useRef(null);

  // 块类型选项
  const blockTypes = [
    {
      type: 'paragraph',
      label: '文本',
      icon: '📝',
      description: '普通文本段落',
    },
    {
      type: 'heading-one',
      label: '标题 1',
      icon: '#',
      description: '大标题',
    },
    {
      type: 'heading-two',
      label: '标题 2',
      icon: '##',
      description: '中标题',
    },
    {
      type: 'heading-three',
      label: '标题 3',
      icon: '###',
      description: '小标题',
    },
    {
      type: 'bulleted-list',
      label: '无序列表',
      icon: '•',
      description: '创建无序列表',
    },
    {
      type: 'numbered-list',
      label: '有序列表',
      icon: '1.',
      description: '创建有序列表',
    },
    {
      type: 'todo-list',
      label: '待办事项',
      icon: '☐',
      description: '创建待办清单',
    },
    {
      type: 'quote',
      label: '引用',
      icon: '❝',
      description: '创建引用块',
    },
    {
      type: 'code-block',
      label: '代码块',
      icon: '{ }',
      description: '插入代码块',
    },
    {
      type: 'divider',
      label: '分割线',
      icon: '—',
      description: '插入分割线',
    },
    {
      type: 'image',
      label: '图片',
      icon: '🖼️',
      description: '插入图片',
    },
    {
      type: 'formula-block',
      label: '数学公式',
      icon: '🧮',
      description: '插入数学公式',
    },
  ];

  // 其他操作选项
  const actions = [
    {
      id: 'duplicate',
      label: '复制块',
      icon: '📄',
      shortcut: '⌘D',
      description: '复制当前块',
    },
    {
      id: 'delete',
      label: '删除',
      icon: '🗑️',
      shortcut: 'Del',
      description: '删除当前块',
    },
    {
      id: 'move-up',
      label: '上移',
      icon: '⬆️',
      shortcut: '⌘↑',
      description: '向上移动块',
    },
    {
      id: 'move-down',
      label: '下移',
      icon: '⬇️',
      shortcut: '⌘↓',
      description: '向下移动块',
    },
  ];

  // 过滤选项
  const filteredBlockTypes = blockTypes.filter(type =>
    type.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredActions = actions.filter(action =>
    action.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 转换块类型
  const transformBlock = (newType) => {
    if (!blockPath) return;

    try {
      if (newType === 'image') {
        const url = prompt('请输入图片 URL:', 'https://via.placeholder.com/400x200');
        if (url) {
          const imageElement = {
            type: 'image',
            url,
            children: [{ text: '' }],
          };
          Transforms.setNodes(editor, imageElement, { at: blockPath });
        }
      } else if (newType === 'formula-block') {
        const latex = prompt('请输入 LaTeX 公式:', 'E = mc^2');
        if (latex !== null) {
          const formulaElement = {
            type: 'formula-block',
            latex: latex || 'E = mc^2',
            children: [{ text: '' }],
          };
          Transforms.setNodes(editor, formulaElement, { at: blockPath });
        }
      } else if (newType === 'divider') {
        const dividerElement = {
          type: 'divider',
          children: [{ text: '' }],
        };
        Transforms.setNodes(editor, dividerElement, { at: blockPath });
      } else {
        Transforms.setNodes(
          editor,
          { type: newType },
          { at: blockPath }
        );
      }
      onClose();
    } catch (error) {
      console.error('转换块类型时出错:', error);
    }
  };

  // 执行操作
  const executeAction = (actionId) => {
    if (!blockPath) return;

    try {
      switch (actionId) {
        case 'duplicate':
          const [node] = Editor.node(editor, blockPath);
          Transforms.insertNodes(editor, { ...node }, { at: [blockPath[0] + 1] });
          break;
        case 'delete':
          Transforms.removeNodes(editor, { at: blockPath });
          break;
        case 'move-up':
          if (blockPath[0] > 0) {
            Transforms.moveNodes(editor, {
              at: blockPath,
              to: [blockPath[0] - 1],
            });
          }
          break;
        case 'move-down':
          const [, parentPath] = Editor.parent(editor, blockPath);
          const parent = Editor.node(editor, parentPath)[0];
          if (blockPath[0] < parent.children.length - 1) {
            Transforms.moveNodes(editor, {
              at: blockPath,
              to: [blockPath[0] + 2],
            });
          }
          break;
      }
      onClose();
    } catch (error) {
      console.error('执行操作时出错:', error);
    }
  };

  // 键盘事件处理和点击外部关闭
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: position?.x || 0,
        top: position?.y || 0,
        zIndex: 1000,
        backgroundColor: '#fff',
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        width: '280px',
        maxHeight: '400px',
        overflow: 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 搜索框 */}
      <div style={{ padding: '12px' }}>
        <input
          type="text"
          placeholder="搜索操作..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e1e5e9',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {/* 块类型转换 */}
        {filteredBlockTypes.length > 0 && (
          <>
            <div
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#666',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #e1e5e9',
              }}
            >
              转换为
            </div>
            {filteredBlockTypes.map((blockType) => (
              <div
                key={blockType.type}
                onClick={() => transformBlock(blockType.type)}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>
                  {blockType.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500' }}>{blockType.label}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {blockType.description}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* 操作选项 */}
        {filteredActions.length > 0 && (
          <>
            <div
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#666',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #e1e5e9',
              }}
            >
              操作
            </div>
            {filteredActions.map((action) => (
              <div
                key={action.id}
                onClick={() => executeAction(action.id)}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>
                  {action.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500' }}>{action.label}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {action.description}
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: '#999' }}>
                  {action.shortcut}
                </span>
              </div>
            ))}
          </>
        )}

        {/* 无结果提示 */}
        {filteredBlockTypes.length === 0 && filteredActions.length === 0 && (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: '#666',
              fontSize: '14px',
            }}
          >
            未找到匹配的操作
          </div>
        )}
      </div>
    </div>
  );
}
