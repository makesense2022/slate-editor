import React, { useEffect, useRef } from 'react';

/**
 * 数学公式元素组件
 * @param {Object} props - 组件属性
 * @param {Object} props.attributes - Slate 传递的属性
 * @param {Object} props.element - 数学公式元素数据
 * @param {React.ReactNode} props.children - 子元素
 */
export function MathElement({ attributes, element, children }) {
  const mathRef = useRef(null);
  const latex = element.attrs?.latex || element.latex || '';
  const displayMode = element.attrs?.displayMode ?? element.displayMode ?? false;

  useEffect(() => {
    // 检查是否有 KaTeX 可用
    if (typeof window !== 'undefined' && window.katex && mathRef.current) {
      try {
        window.katex.render(latex, mathRef.current, {
          displayMode: displayMode,
          throwOnError: false,
          errorColor: '#cc0000',
          strict: false,
        });
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        // 如果渲染失败，显示原始 LaTeX
        if (mathRef.current) {
          mathRef.current.textContent = displayMode ? `$$${latex}$$` : `$${latex}$`;
        }
      }
    } else {
      // 如果没有 KaTeX，显示原始 LaTeX
      if (mathRef.current) {
        mathRef.current.textContent = displayMode ? `$$${latex}$$` : `$${latex}$`;
      }
    }
  }, [latex, displayMode]);

  // 加载 KaTeX CSS 和 JS（如果还没加载）
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.katex) {
      // 加载 KaTeX CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
      document.head.appendChild(cssLink);

      // 加载 KaTeX JS
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js';
      script.async = true;
      script.onload = () => {
        // KaTeX 加载完成后重新渲染
        if (mathRef.current && window.katex) {
          try {
            window.katex.render(latex, mathRef.current, {
              displayMode: displayMode,
              throwOnError: false,
              errorColor: '#cc0000',
              strict: false,
            });
          } catch (error) {
            console.error('KaTeX rendering error:', error);
          }
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  // 内联数学公式应该没有额外的样式，直接融入文本中
  const containerStyle = displayMode ? {
    display: 'block',
    margin: '10px 0',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    border: '1px solid #e9ecef',
    textAlign: 'center',
    minHeight: '40px',
    cursor: 'pointer',
  } : {
    display: 'inline',
    margin: '0',
    padding: '0',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  };

  return (
    <span {...attributes} contentEditable={false} style={containerStyle}>
      <span
        ref={mathRef}
        style={{
          fontFamily: 'KaTeX_Main, "Times New Roman", serif',
          fontSize: displayMode ? '1.2em' : '1em',
          display: 'inline',
        }}
      >
        {/* 占位内容，会被 KaTeX 替换 */}
        {displayMode ? `$$${latex}$$` : `$${latex}$`}
      </span>
      {children}
    </span>
  );
}
