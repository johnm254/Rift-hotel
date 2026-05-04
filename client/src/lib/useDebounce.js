import { useState, useEffect } from 'react';

/**
 * Debounces a value — only updates after `delay` ms of no changes.
 * Prevents expensive re-renders on every keystroke.
 *
 * @param {any} value - The value to debounce
 * @param {number} delay - Milliseconds to wait (default 300)
 * @returns {any} The debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
