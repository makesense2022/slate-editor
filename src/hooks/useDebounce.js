import { useState, useEffect } from 'react';

/**
 * 自定义防抖 Hook
 * @param {*} value - 需要防抖的值
 * @param {number} delay - 防抖延迟时间（毫秒）
 * @returns {*} 防抖后的值
 */
export function useDebounce(value, delay) {
  // 存储防抖后的值
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // 设置定时器，在延迟时间后更新防抖值
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 清理函数：如果 value 或 delay 改变，清除之前的定时器
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // 依赖项：当 value 或 delay 改变时重新执行

  return debouncedValue;
}
