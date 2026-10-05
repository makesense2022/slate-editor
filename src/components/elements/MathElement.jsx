import { useEffect, useRef } from 'react';
import katex from 'katex';

/** Render inline math with the installed KaTeX dependency, including offline. */
export function MathElement({ attributes, element, children }) {
  const mathRef = useRef(null);
  const latex = element.attrs?.latex ?? element.latex ?? '';
  const displayMode = element.attrs?.displayMode ?? element.displayMode ?? false;

  useEffect(() => {
    katex.render(latex, mathRef.current, {
      displayMode,
      throwOnError: false,
      errorColor: '#cc0000',
      strict: false,
    });
  }, [latex, displayMode]);

  return (
    <span {...attributes}>
      <span contentEditable={false} style={{ display: displayMode ? 'block' : 'inline', margin: displayMode ? '10px 0' : 0 }}>
        <span ref={mathRef} />
      </span>
      {children}
    </span>
  );
}
