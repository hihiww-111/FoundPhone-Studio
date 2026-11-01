import { useRef, useState } from "react";
import { safeMedia } from "../schema";

export function RedbookGallery({title, sources}: {title: string; sources: string}) {
  const images = sources.split("|").map(safeMedia).filter(Boolean);
  const [page, setPage] = useState(0);
  const start = useRef<{x: number; y: number} | null>(null);
  const finish = (x: number, y: number) => {
    const origin = start.current; start.current = null;
    if (!origin) return;
    const dx=x-origin.x, dy=y-origin.y;
    if (Math.abs(dx)>30 && Math.abs(dx)>Math.abs(dy)*1.2)
      setPage(p=>Math.max(0,Math.min(images.length-1,p+(dx<0?1:-1))));
  };
  return <section className="rb-image-carousel" aria-label="帖子图片">
    <div className="rb-image-stage"
      onTouchStart={e=>{start.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}}
      onTouchEnd={e=>finish(e.changedTouches[0].clientX,e.changedTouches[0].clientY)}
      onTouchCancel={()=>{start.current=null;}}
      onPointerDown={e=>{if(e.pointerType!=="mouse") return;start.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}
      onPointerUp={e=>{if(e.pointerType==="mouse")finish(e.clientX,e.clientY);}}
      onPointerCancel={()=>{start.current=null;}}>
      <img src={images[page]} alt={`${title} · ${page+1}/${images.length}`} draggable={false}/>
    </div>
    <nav className="rb-image-dots" aria-label="图片翻页">{images.map((_,i)=><button key={i} aria-label={`查看第${i+1}张图片`} aria-pressed={page===i} onClick={()=>setPage(i)}/>)}<span className="rb-image-count" role="status">{page+1}/{images.length}</span></nav>
  </section>;
}
