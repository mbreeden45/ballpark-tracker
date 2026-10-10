'use client';

import { useEffect, useRef, useState } from 'react';

/** Becomes true once the element nears the viewport, and stays true. */
export function useInView<T extends HTMLElement>(rootMargin = '200px'): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [seen, rootMargin]);

  return [ref, seen];
}
