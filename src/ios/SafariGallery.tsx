import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { safeMedia } from "../schema";

export function SafariGallery({ title, sources }: { title: string; sources: string }) {
  const images = sources.split("|").map(safeMedia).filter(Boolean);
  const [page, setPage] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const finish = (x: number, y: number) => {
    const origin = start.current;
    start.current = null;
    if (!origin) return;
    const dx = x - origin.x, dy = y - origin.y;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.2)
      setPage((p) => Math.max(0, Math.min(images.length - 1, p + (dx < 0 ? 1 : -1))));
  };
  return (
    <section className="safari-gallery" aria-label={title}>
      <div
        className="safari-gallery-stage"
        onTouchStart={(e) => { start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={(e) => finish(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
        onTouchCancel={() => { start.current = null; }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") return;
          start.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => { if (e.pointerType === "mouse") finish(e.clientX, e.clientY); }}
        onPointerCancel={() => { start.current = null; }}
      >
        <img src={images[page]} alt={`${title} 第 ${page + 1} 张`} draggable={false} />
      </div>
      <nav className="safari-gallery-controls" aria-label="图片翻页">
        <button aria-label="上一张" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={22} /></button>
        <span role="status">{page + 1} / {images.length}</span>
        <button aria-label="下一张" disabled={page === images.length - 1} onClick={() => setPage(page + 1)}><ChevronRight size={22} /></button>
      </nav>
    </section>
  );
}
