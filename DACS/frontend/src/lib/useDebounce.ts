import { useEffect, useState } from "react";

// Trả về giá trị sau khi người dùng ngừng thay đổi `delay` ms (tránh gọi API mỗi lần gõ phím)
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
