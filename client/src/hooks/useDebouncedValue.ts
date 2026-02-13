/**
 * useDebouncedValue - 防抖值 Hook
 * 用于搜索输入等高频变化场景，避免每次输入都触发重渲染/过滤
 */
import { useState, useEffect } from "react";

export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
