import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { createEditor, Editor, Transforms, Range, Element as SlateElement } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { useDebounce } from '../hooks/useDebounce.js';
import { Toolbar } from './menus/Toolbar.js';
import { BlockWrapper } from './elements/BlockWrapper.js';
import { SlashMenu } from './menus/SlashMenu.js';
import { ImageElement } from './elements/ImageElement.js';
import { FormulaBlock } from './elements/FormulaBlock.js';
import { TodoElement } from './elements/TodoElement.js';
import { CodeBlockElement } from './elements/CodeBlockElement.js';
import { QuoteElement } from './elements/QuoteElement.js';
import { DividerElement } from './elements/DividerElement.js';
import { ListElement } from './elements/ListElement.js';
import { MathElement } from './elements/MathElement.js';
import { TableElement, TableRowElement, TableCellElement } from './elements/TableElement.js';
import { proseMirrorToSlate, slateToProseMirror } from '../utils/dataConverter.js';
/**
 * 主编辑器组件
 * @param {Object} props - 组件属性
 * @param {Object} [props.initialData] - 初始数据（ProseMirror 格式，可选）
 * @param {boolean} [props.readOnly] - 是否为只读模式，默认 false
 * @param {boolean} [props.showToolbar] - 是否显示工具栏，默认 true
 * @param {boolean} [props.showBlockControls] - 是否显示块控制按钮，默认 true
 * @param {Function} [props.onSave] - 保存回调函数
 */
export function EditorComponent({ 
    initialData, 
    readOnly = false, 
    showToolbar = true, 
    showBlockControls = true,
    onSave 
}: { 
    initialData?: any;
    readOnly?: boolean;
    showToolbar?: boolean;
    showBlockControls?: boolean;
    onSave?: (data: any) => void;
}) {
    // 创建编辑器实例，添加 React 和历史记录插件
    const editor = useMemo(
        () => withHistory(withReact(createEditor())),
        []
    );

      // 配置编辑器的 void 元素（不可编辑的块级元素）
  editor.isVoid = (element) => {
        return element.type === 'image' || element.type === 'formula-block' || element.type === 'divider' || element.type === 'math-inline';
  };

  // 配置编辑器的块级元素
  editor.isBlock = (element) => {
        return element.type !== undefined && element.text === undefined && element.type !== 'math-inline';
  };

    // 将初始数据从 ProseMirror 格式转换为 Slate.js 格式
  const convertedInitialValue = useMemo(() => {
    try {
      if (initialData) {
        return proseMirrorToSlate(initialData);
      } else {
        // 默认空内容
        return [{ type: 'paragraph', children: [{ text: '欢迎使用编辑器！' }] }];
      }
    } catch (error) {
      console.error('转换初始数据时出错:', error);
      return [{ type: 'paragraph', children: [{ text: '欢迎使用编辑器！' }] }];
    }
  }, [initialData]);

  // 编辑器状态
  const [value, setValue] = useState(convertedInitialValue);
  
  // 斜杠菜单状态
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuTarget, setSlashMenuTarget] = useState<any>(null);

    // 监听触发斜杠菜单事件
    useEffect(() => {
        const handleTriggerSlashMenu = (event) => {
            const { path } = event.detail;
            setSlashMenuTarget({ path, offset: 0 });
            setShowSlashMenu(true);
        };

        document.addEventListener('triggerSlashMenu', handleTriggerSlashMenu);
        return () => document.removeEventListener('triggerSlashMenu', handleTriggerSlashMenu);
    }, []);
  
  // 使用防抖处理内容变更，延迟 1000ms
  const debouncedValue = useDebounce(value, 1000);

      // 保存函数
  const saveContent = async (content) => {
    try {
      // 将 Slate.js 格式转换为后端需要的 ProseMirror 格式
      const proseMirrorData = slateToProseMirror(content);
      
      if (onSave) {
        // 如果提供了 onSave 回调，使用它
        await onSave(proseMirrorData);
      }
    } catch (error) {
      console.error('保存内容时出错:', error);
    }
  };

      // 监听防抖后的值变化，触发自动保存（只读模式下不保存）
  useEffect(() => {
    // 避免初次渲染时就触发保存，只读模式下也不保存
    if (!readOnly && debouncedValue !== convertedInitialValue) {
      saveContent(debouncedValue);
    }
  }, [debouncedValue, convertedInitialValue, readOnly]);

    // 渲染不同类型的元素
    const renderElement = useCallback((props) => {
        const { element } = props;

        // 获取实际的元素内容组件
        let ElementComponent;

            switch (element.type) {
      case 'heading-one':
        ElementComponent = (props) => <h1 {...props.attributes} style={{ fontSize: '2em', fontWeight: 'bold', margin: '0.67em 0' }}>{props.children}</h1>;
        break;
      case 'heading-two':
        ElementComponent = (props) => <h2 {...props.attributes} style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '0.83em 0' }}>{props.children}</h2>;
        break;
      case 'heading-three':
        ElementComponent = (props) => <h3 {...props.attributes} style={{ fontSize: '1.17em', fontWeight: 'bold', margin: '1em 0' }}>{props.children}</h3>;
        break;
      case 'heading-four':
        ElementComponent = (props) => <h4 {...props.attributes} style={{ fontSize: '1em', fontWeight: 'bold', margin: '1.33em 0' }}>{props.children}</h4>;
        break;
      case 'heading-five':
        ElementComponent = (props) => <h5 {...props.attributes} style={{ fontSize: '0.83em', fontWeight: 'bold', margin: '1.67em 0' }}>{props.children}</h5>;
        break;
      case 'heading-six':
        ElementComponent = (props) => <h6 {...props.attributes} style={{ fontSize: '0.67em', fontWeight: 'bold', margin: '2.33em 0' }}>{props.children}</h6>;
        break;
      case 'bulleted-list':
      case 'numbered-list':
        ElementComponent = ListElement;
        break;
      case 'todo-list':
        ElementComponent = TodoElement;
        break;
      case 'quote':
        ElementComponent = QuoteElement;
        break;
      case 'code-block':
        ElementComponent = CodeBlockElement;
        break;
      case 'divider':
        ElementComponent = DividerElement;
        break;
      case 'image':
        ElementComponent = ImageElement;
        break;
      case 'formula-block':
        ElementComponent = (props) => <FormulaBlock {...props} editor={editor} />;
        break;
            case 'math-inline':
                ElementComponent = MathElement;
                break;
            case 'table':
                ElementComponent = TableElement;
                break;
            case 'table-row':
                ElementComponent = TableRowElement;
                break;
            case 'table-header':
            case 'table-cell':
                ElementComponent = TableCellElement;
        break;
      default:
        ElementComponent = (props) => <p {...props.attributes} style={{ margin: '0', minHeight: '1.5em' }}>{props.children}</p>;
    }

        // 对于内联元素（如数学公式）和表格子元素，不使用 BlockWrapper 包装
        if (element.type === 'math-inline' || 
            element.type === 'table-row' || 
            element.type === 'table-header' || 
            element.type === 'table-cell') {
            return <ElementComponent {...props} />;
        }

        // 用 BlockWrapper 包装所有块级元素以提供块级功能
        return (
            <BlockWrapper 
                element={element} 
                attributes={props.attributes}
                readOnly={readOnly}
                showControls={showBlockControls}
            >
                <ElementComponent {...props} />
            </BlockWrapper>
        );
    }, [editor]);

      // 渲染文本叶子节点（处理内联格式）
  const renderLeaf = useCallback((props) => {
    let children = props.children;

    // 处理粗体格式
    if (props.leaf.bold) {
      children = <strong>{children}</strong>;
    }

    // 处理斜体格式
    if (props.leaf.italic) {
      children = <em>{children}</em>;
    }

    // 处理行内代码
    if (props.leaf.code) {
      children = (
        <code style={{
          backgroundColor: '#f1f3f4',
          padding: '2px 4px',
          borderRadius: '3px',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          fontSize: '0.9em'
        }}>
          {children}
        </code>
      );
    }

    // 处理链接
    if (props.leaf.link && props.leaf.url) {
      children = (
        <a
          href={props.leaf.url}
          target="_blank"
          rel="noopener noreferrer"
          contentEditable={false}
          style={{
            color: '#007AFF',
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
          onClick={(e) => {
            // 阻止事件冒泡到编辑器，但保留默认的链接跳转行为
            e.stopPropagation();
            // 手动打开链接以确保跳转
            window.open(props.leaf.url, '_blank', 'noopener,noreferrer');
          }}
          onMouseDown={(e) => {
            // 完全阻止编辑器处理这个事件
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {children}
        </a>
      );
    }

    return <span {...props.attributes}>{children}</span>;
  }, []);

    // 检查是否选中了整个块
    const isBlockSelected = useCallback(() => {
        const { selection } = editor;
        if (!selection) return false;

        const [match] = Editor.nodes(editor, {
            match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        });

        if (!match) return false;

        const [block, path] = match;
        const start = Editor.start(editor, path);
        const end = Editor.end(editor, path);

        // 检查选区是否覆盖了整个块
        return (
            Range.includes(selection, start) &&
            Range.includes(selection, end) &&
            Editor.string(editor, path) === Editor.string(editor, selection)
        );
    }, [editor]);

    // 处理键盘快捷键
    const onKeyDown = useCallback((event) => {
        const { selection } = editor;

        // 处理删除键 - 如果选中了整个块，删除整个块
        if ((event.key === 'Delete' || event.key === 'Backspace') && selection) {
            const [match] = Editor.nodes(editor, {
                match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
            });

            if (match) {
                const [block, path] = match as any;
                const blockText = Editor.string(editor, path);
                const selectedText = selection ? Editor.string(editor, selection) : '';

                // 对于 void 元素，如果选中了就删除
                if (editor.isVoid(block)) {
                    // 检查光标是否在 void 元素上
                    const [voidMatch] = Editor.nodes(editor, {
                        at: selection,
                        match: n => SlateElement.isElement(n) && editor.isVoid(n),
                    });

                    if (voidMatch) {
                        event.preventDefault();

                        // 检查是否是文档中的最后一个块
                        const parent = Editor.parent(editor, path);
                        const parentNode = parent[0];

                        if (parentNode.children && parentNode.children.length === 1) {
                            // 如果是最后一个块，替换为空段落
                            Transforms.removeNodes(editor, { at: path });
                            Transforms.insertNodes(editor, {
                                type: 'paragraph',
                                children: [{ text: '' }]
                            }, { at: path });
                        } else {
                            // 删除整个块
                            Transforms.removeNodes(editor, { at: path });
                        }
                        return;
                    }
                }

                // 如果选中的文本等于整个块的文本，说明选中了整个块
                if (selectedText === blockText && blockText.length > 0) {
                    event.preventDefault();

                    // 检查是否是文档中的最后一个块
                    const parent = Editor.parent(editor, path);
                    const parentNode = parent[0];

                    if (parentNode.children && parentNode.children.length === 1) {
                        // 如果是最后一个块，不删除，而是转换为空段落
                        Transforms.setNodes(editor, {
                            type: 'paragraph',
                            children: [{ text: '' }]
                        }, { at: path });
                    } else {
                        // 删除整个块
                        Transforms.removeNodes(editor, { at: path });
                    }
                    return;
                }
            }
        }

        // 处理斜杠菜单
        if (event.key === '/' && selection && Range.isCollapsed(selection)) {
            const [match] = Editor.nodes(editor, {
                match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
            });

            if (match) {
                const [block] = match as any;
                // 只在段落中触发斜杠菜单
                if (block.type === 'paragraph') {
                    const text = Editor.string(editor, selection.focus.path);
                    const beforeText = text.slice(0, selection.focus.offset);

                    // 如果是在行首或空格后输入 /，显示菜单
                    if (beforeText === '' || beforeText.endsWith(' ')) {
                        // 确保先关闭现有菜单，再显示新菜单
                        setShowSlashMenu(false);
                        setSlashMenuTarget(null);

                        // 使用 setTimeout 确保状态更新完成
                        setTimeout(() => {
                        setSlashMenuTarget(selection.focus);
                        setShowSlashMenu(true);
                        }, 0);
                        return; // 让默认行为继续，输入 / 字符
                    }
                }
            }
        }

        // Ctrl+B 或 Cmd+B 切换粗体
        if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
            event.preventDefault();
            const isActive = editor.marks?.bold === true;
            if (isActive) {
                editor.removeMark('bold');
            } else {
                editor.addMark('bold', true);
            }
            return;
        }

        // 处理回车键
        if (event.key === 'Enter') {
            if (!selection) return;

            const [match] = Editor.nodes(editor, {
                match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
            });

            if (!match) return;

            const [block, path] = match as any;
            const { type } = block;

            // 对于某些块类型，回车应该在块内换行而不是创建新块
            if (type === 'code-block') {
                // 代码块内允许换行
                event.preventDefault();
                editor.insertText('\n');
                return;
            }

            if (type === 'quote') {
                // 引用块内允许换行，但如果是空行则退出引用
                const text = Editor.string(editor, path);
                if (text.trim() === '') {
                    event.preventDefault();
                    Transforms.setNodes(editor, { type: 'paragraph' });
                    return;
                }
                // 非空行时允许换行
                event.preventDefault();
                editor.insertText('\n');
                return;
            }

            // 对于列表项和待办事项，如果内容为空则转换为段落
            if (['bulleted-list', 'numbered-list', 'todo-list'].includes(type)) {
                const text = Editor.string(editor, path);
                if (text.trim() === '') {
                    event.preventDefault();
                    Transforms.setNodes(editor, { type: 'paragraph' });
                    return;
                }
                // 非空时创建新的同类型项目
                event.preventDefault();
                const newElement: any = {
                    type: type,
                    children: [{ text: '' }],
                };
                if (type === 'todo-list') {
                    newElement.checked = false;
                }
                Transforms.insertNodes(editor, newElement);
                return;
            }

            // 对于标题，回车后创建普通段落
            if (['heading-one', 'heading-two', 'heading-three'].includes(type)) {
                event.preventDefault();
                Transforms.insertNodes(editor, {
                    type: 'paragraph',
                    children: [{ text: '' }],
                });
                return;
            }

            // 对于 void 元素（图片、公式、分割线），回车后创建新段落
            if (editor.isVoid(block)) {
                event.preventDefault();
                Transforms.insertNodes(editor, {
                    type: 'paragraph',
                    children: [{ text: '' }],
                });
                return;
            }

            // 默认行为：普通段落允许正常的回车换行
        }
    }, [editor]);

    return (
        <div
            style={{
                maxWidth: '800px',
                margin: '20px auto',
                border: readOnly ? '1px solid #f0f0f0' : '1px solid #e1e5e9',
                borderRadius: '8px',
                backgroundColor: readOnly ? '#fafafa' : '#fff',
                boxShadow: readOnly ? 'none' : '0 2px 4px rgba(0,0,0,0.1)',
                opacity: readOnly ? 0.95 : 1,
            }}
        >
                  <Slate
        editor={editor}
        initialValue={convertedInitialValue}
                onChange={(newValue) => {
                    setValue(newValue);

                    // 如果内容发生变化，关闭斜杠菜单（除非是刚刚触发菜单的 / 输入）
                    if (showSlashMenu) {
                        try {
                            const currentText = Editor.string(editor, editor.selection?.focus?.path || []);
                            const currentOffset = editor.selection?.focus?.offset || 0;
                            const beforeText = currentText.slice(0, currentOffset);

                            // 如果不是以 / 结尾，说明用户已经移动了光标或修改了内容，应该关闭菜单
                            if (!beforeText.endsWith('/')) {
                                setShowSlashMenu(false);
                                setSlashMenuTarget(null);
                            }
                        } catch (error) {
                            // 如果出错，直接关闭菜单
                            setShowSlashMenu(false);
                            setSlashMenuTarget(null);
                        }
                    }
                }}
      >
                {/* 工具栏 - 只读模式下隐藏 */}
                {showToolbar && !readOnly && <Toolbar />}

                {/* 编辑器主体 */}
                <div
                    style={{
                        padding: '20px', // 恢复正常内边距，因为 BlockWrapper 已经处理了左边距
                        minHeight: '400px',
                    }}
                    onClick={(e) => {
                        // 点击编辑器外部区域关闭所有菜单
                        if (e.target === e.currentTarget) {
                            setShowSlashMenu(false);
                            setSlashMenuTarget(null);
                        }
                    }}
                >
                    <Editable
                        renderElement={renderElement}
                        renderLeaf={renderLeaf}
                        onKeyDown={readOnly ? undefined : onKeyDown}
                        placeholder={readOnly ? "" : "输入 '/' 快速插入块，或点击左侧 + 按钮..."}
                        readOnly={readOnly}
                        onDOMBeforeInput={(e) => {
                            // 允许链接的默认行为
                            const target = e.target as HTMLElement;
                            if (target && target.tagName === 'A') {
                                return;
                            }
                        }}
                        style={{
                            outline: 'none',
                            lineHeight: '1.6',
                            fontSize: '16px',
                            color: '#333',
                            cursor: readOnly ? 'default' : 'text',
                        }}
                    />
                </div>

                {/* 斜杠菜单 - 只读模式下不显示 */}
                {!readOnly && (
                <SlashMenu
                    isOpen={showSlashMenu}
                    onClose={() => {
                        setShowSlashMenu(false);
                        setSlashMenuTarget(null);
                    }}
                    target={slashMenuTarget}
                />
                )}

                {/* 状态栏 */}
                <div
                    style={{
                        padding: '8px 20px',
                        borderTop: '1px solid #e1e5e9',
                        backgroundColor: '#f8f9fa',
                        fontSize: '12px',
                        color: '#666',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span>{readOnly ? "只读模式" : "自动保存已启用"}</span>
                    <span>字符数: {JSON.stringify(value).length}</span>
                </div>
            </Slate>
        </div>
    );
}
