import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { safeMedia, type Item } from "../schema";
import { photoSwipeTarget } from "./photoNavigation";

export function PhotoStage({ item, photos, onPhoto }: {
  item: Item;
  photos: Item[];
  onPhoto?: (item: Item) => void;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const index = photos.findIndex((photo) => photo.id === item.id);
  const go = (next: number) => {
    if (next !== index && photos[next]) onPhoto?.(photos[next]);
  };
  const finish = (x: number, y: number) => {
    const origin = start.current;
    start.current = null;
    if (origin && index >= 0) go(photoSwipeTarget(index, photos.length, x - origin.x, y - origin.y));
  };
  const media = safeMedia(item.media);
  return (
    <section className="photo-viewer" aria-label="照片查看器">
      <div className="native-photo-stage"
        onTouchStart={(e) => { start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={(e) => finish(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
        onTouchCancel={() => { start.current = null; }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || e.button !== 0) return;
          start.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => { if (e.pointerType === "mouse") finish(e.clientX, e.clientY); }}
        onPointerCancel={() => { start.current = null; }}
      >
        {media ? <img src={media} alt={item.title} draggable={false} /> : (
          <div className="native-photo-caption"><h2>{item.title}</h2><p>{item.body}</p></div>
        )}
      </div>
      {index >= 0 && photos.length > 1 && (
        <nav className="photo-viewer-controls" aria-label="照片翻页">
          <button aria-label="上一张照片" disabled={index === 0} onClick={() => go(index - 1)}><ChevronLeft size={21} /></button>
          <span role="status">{index + 1} / {photos.length}</span>
          <button aria-label="下一张照片" disabled={index === photos.length - 1} onClick={() => go(index + 1)}><ChevronRight size={21} /></button>
        </nav>
      )}
    </section>
  );
}
