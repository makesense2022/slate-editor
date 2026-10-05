import { useState, useEffect, useRef } from 'react';
import { Editor, Transforms, Element as SlateElement } from 'slate';
import { ReactEditor, useSlate, useReadOnly } from 'slate-react';

/**
 * 斜杠命令菜单组件
 * @param {Object} props - 组件属性
 * @param {boolean} props.isOpen - 菜单是否打开
 * @param {Function} props.onClose - 关闭菜单回调
 * @param {Object} props.target - 目标位置
 */
export function SlashMenu({ isOpen, onClose, target }) {
  const editor = useSlate();
  const readOnly = useReadOnly();
  const menuRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [search, setSearch] = useState('');

  // 快速插入选项
  const quickInsertOptions = [
    {
      type: 'paragraph',
      label: '文本',
      icon: '📝',
      description: '普通文本段落',
      keywords: ['text', 'paragraph', '文本', '段落'],
    },
    {
      type: 'heading-one',
      label: '大标题',
      icon: 'H1',
      description: '# 大标题',
      keywords: ['heading', 'h1', 'title', '标题', '大标题'],
    },
    {
      type: 'heading-two',
      label: '中标题',
      icon: 'H2',
      description: '## 中标题',
      keywords: ['heading', 'h2', 'subtitle', '标题', '中标题'],
    },
    {
      type: 'heading-three',
      label: '小标题',
      icon: 'H3',
      description: '### 小标题',
      keywords: ['heading', 'h3', '标题', '小标题'],
    },
    {
      type: 'bulleted-list',
      label: '无序列表',
      icon: '•',
      description: '创建无序列表',
      keywords: ['list', 'bullet', 'ul', '列表', '无序'],
    },
    {
      type: 'numbered-list',
      label: '有序列表',
      icon: '1.',
      description: '创建有序列表',
      keywords: ['list', 'number', 'ol', '列表', '有序', '数字'],
    },
    {
      type: 'todo-list',
      label: '待办事项',
      icon: '☐',
      description: '创建待办清单',
      keywords: ['todo', 'task', 'checkbox', '待办', '任务', '清单'],
    },
    {
      type: 'quote',
      label: '引用',
      icon: '❝',
      description: '创建引用块',
      keywords: ['quote', 'blockquote', '引用'],
    },
    {
      type: 'code-block',
      label: '代码块',
      icon: '{ }',
      description: '插入代码块',
      keywords: ['code', 'pre', '代码'],
    },
    {
      type: 'divider',
      label: '分割线',
      icon: '—',
      description: '插入分割线',
      keywords: ['divider', 'hr', 'line', '分割线', '分隔符'],
    },
    {
      type: 'image',
      label: '图片',
      icon: '🖼️',
      description: '插入图片',
      keywords: ['image', 'picture', 'photo', '图片', '图像'],
    },
    {
      type: 'formula-block',
      label: '数学公式',
      icon: '🧮',
      description: '插入数学公式',
      keywords: ['math', 'formula', 'latex', '数学', '公式'],
    },
  ];

  // 过滤选项
  const filteredOptions = quickInsertOptions.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase()) ||
    option.description.toLowerCase().includes(search.toLowerCase()) ||
    option.keywords.some(keyword => 
      keyword.toLowerCase().includes(search.toLowerCase())
    )
  );

  // 插入块
  const insertBlock = (blockType) => {
    if (!target || readOnly) return;

    try {
      // 删除 "/" 字符
      Transforms.select(editor, target);
      if (target.offset > 0) {
        const slashRange = {
          anchor: { path: target.path, offset: target.offset - 1 },
          focus: target,
        };
        if (Editor.string(editor, slashRange) === '/') {
          Transforms.delete(editor, { at: slashRange });
        }
      }

      if (blockType === 'image') {
        const url = prompt('请输入图片 URL:', 'https://via.placeholder.com/400x200');
        if (url) {
          const imageElement = {
            type: 'image',
            url,
            children: [{ text: '' }],
          };
          Transforms.insertNodes(editor, imageElement);
        }
      } else if (blockType === 'formula-block') {
        const latex = prompt('请输入 LaTeX 公式:', 'E = mc^2');
        if (latex !== null) {
          const formulaElement = {
            type: 'formula-block',
            latex: latex || 'E = mc^2',
            children: [{ text: '' }],
          };
          Transforms.insertNodes(editor, formulaElement);
        }
      } else if (blockType === 'divider') {
        const dividerElement = {
          type: 'divider',
          children: [{ text: '' }],
        };
        Transforms.insertNodes(editor, dividerElement);
      } else {
        const newElement = {
          type: blockType,
          children: [{ text: '' }],
        };
        
        if (blockType === 'todo-list') {
          newElement.checked = false;
        }
        
        if (blockType === 'code-block') {
          newElement.language = 'javascript';
        }

        // 转换当前块
        const [match] = Editor.nodes(editor, {
          match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        });

        if (match) {
          Transforms.setNodes(editor, newElement);
        }
      }

      onClose();
    } catch (error) {
      console.error('插入块时出错:', error);
      onClose();
    }
  };

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;

      // Consume menu navigation before Editable handles Enter/arrow keys.
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredOptions[selectedIndex]) {
            insertBlock(filteredOptions[selectedIndex].type);
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'Backspace':
          // 如果搜索为空，关闭菜单
          if (search === '') {
            onClose();
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown, true);
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [isOpen, selectedIndex, filteredOptions, search, insertBlock, onClose]);

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (isOpen && event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, onClose]);

  // 获取菜单位置
  const getMenuPosition = () => {
    if (!target || !editor.selection) return { top: 0, left: 0 };

    try {
      const domRange = ReactEditor.toDOMRange(editor, editor.selection);
      const rect = domRange.getBoundingClientRect();
      return {
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX,
      };
    } catch (error) {
      return { top: 0, left: 0 };
    }
  };

  if (!isOpen || filteredOptions.length === 0) return null;

  const position = getMenuPosition();

  return (
    <div
      ref={menuRef}
      contentEditable={false}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 1000,
        backgroundColor: '#fff',
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        width: '280px',
        maxHeight: '300px',
        overflow: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.preventDefault()}
    >
      {filteredOptions.map((option, index) => (
        <div
          key={option.type}
          onClick={() => insertBlock(option.type)}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            backgroundColor: index === selectedIndex ? '#f8f9fa' : 'transparent',
            transition: 'background-color 0.2s',
          }}
        >
          <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>
            {option.icon}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '500' }}>{option.label}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {option.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
