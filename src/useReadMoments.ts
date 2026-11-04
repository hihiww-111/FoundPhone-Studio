import { useEffect, useRef } from "react";

export function useReadMoments(active: boolean, readIds: string[], onRead: (id: string) => void, postIds: string[]) {
  const container = useRef<HTMLDivElement>(null);
  const read = useRef(onRead);
  read.current = onRead;
  const key = readIds.join("|");
  const postsKey = postIds.join("|");
  useEffect(() => {
    if (!active || !container.current) return;
    const timers = new Map<Element, ReturnType<typeof setTimeout>>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (timers.has(entry.target)) continue;
          timers.set(entry.target, setTimeout(() => {
            const id = entry.target.getAttribute("data-story-moment");
            if (id) read.current(id);
            observer.unobserve(entry.target);
            timers.delete(entry.target);
          }, 500));
        } else {
          clearTimeout(timers.get(entry.target));
          timers.delete(entry.target);
        }
      }
    }, { threshold: [0, 0.5] });
    container.current.querySelectorAll("[data-story-moment]").forEach(element => {
      if (!readIds.includes(element.getAttribute("data-story-moment") || "")) observer.observe(element);
    });
    return () => { observer.disconnect(); timers.forEach(clearTimeout); };
  }, [active, key, postsKey]);
  return container;
}
