import { useState } from "react";
import { Bookmark, ChevronLeft, Heart, LockKeyhole, Menu, MessageCircle, Plus, Search, Share2, Store, User } from "lucide-react";
import { RichText } from "../RichText";
import { safeMedia, type Item } from "../schema";
import { Avatar, Media, meta, type Props } from "./shared";
import "./redbook.css";

export function RedbookSkin(p: Props) {
  const [page, setPage] = useState<"发现" | "我">("发现");
  const [detail, setDetail] = useState<Item | null>(null);
  const items = p.items.filter((i) => !i.hidden);
  const list = page === "我" ? items.filter((i) => i.favorite || i.folder === "收藏") : items.filter((i) => i.folder !== "收藏");
  const open = (item: Item) => {
    if (p.creator) { p.onItem(item); return; }
    p.onRead(item.id);
    setDetail(item);
  };
  return <div className="catalog-skin redbook-ui rb-app" data-rb-page={detail ? "详情" : page}>
    {detail ? <>
      <header className="rb-detail-nav"><button aria-label="返回小红书" onClick={() => setDetail(null)}><ChevronLeft size={24}/></button><Avatar name={detail.sender}/><strong>{detail.sender}</strong><Share2 size={20}/></header>
      <article className="rb-scroll rb-detail">
        <div className="rb-gallery" aria-label="帖子图片，可左右滑动">
          {(meta(detail, "images") ? meta(detail, "images").split("|") : [detail.media]).map((src, index) => safeMedia(src) ? <img key={index} src={safeMedia(src)} alt={`${detail.title} · ${index + 1}`}/> : null)}
        </div>
        <h1>{detail.title}</h1><RichText value={detail.richText} fallback={detail.body}/>
        {detail.comments.length > 0 && <section className="rb-comments"><h2>评论</h2>{detail.comments.map((c,i)=><p key={i}>{c}</p>)}</section>}
      </article>
      <footer className="rb-detail-footer"><Heart size={22}/><span>{detail.likes || ""}</span><Bookmark size={22}/><MessageCircle size={22}/><span>{detail.comments.length || ""}</span></footer>
    </> : <>
      <main className="rb-scroll" key={page}>
        {page === "发现" ? <header className="rb-discover-head"><span>发现</span><Search size={22} aria-hidden="true"/></header> : <>
          <section className="rb-profile">
            <div className="rb-profile-tools" aria-hidden="true"><Menu size={23}/><span/><Share2 size={23}/></div>
            <div className="rb-identity"><div className="rb-black-avatar" aria-label="黑色头像"/><h1>momo</h1></div>
            <div className="rb-stats"><span><b>23</b> 关注</span><span>粉丝</span><span>获赞与收藏</span></div>
          </section>
          <nav className="rb-profile-tabs" aria-label="个人主页分类">
            {['笔记','评论','收藏','赞过'].map(t=><button key={t} disabled aria-current={t === '收藏' ? 'page' : undefined} className={t === '收藏' ? 'selected' : ''}>{t !== '笔记' && <LockKeyhole size={13}/>} {t}</button>)}
          </nav>
        </>}
        <div className="rb-post-grid">
          {list.map(i=><button className="rb-card" key={i.id} onClick={()=>open(i)} aria-label={`查看帖子：${i.title}`}>
            <Media item={i}/><strong>{i.title}</strong><div className="rb-card-author"><Avatar name={i.sender}/><span>{i.sender}</span><Heart size={14}/><small>{i.likes || ''}</small></div>
          </button>)}
        </div>
        {list.length === 0 && <div className="rb-empty"><Bookmark size={28}/><p>{page === '我' ? '还没有收藏的笔记' : '暂时没有笔记'}</p></div>}
      </main>
      <nav className="rb-bottom" aria-label="小红书导航">
        <button aria-current={page === '发现' ? 'page' : undefined} onClick={()=>setPage('发现')}>首页</button>
        <button disabled><Store size={20}/><span>市集</span></button>
        <button disabled className="rb-publish" aria-label="发布笔记"><Plus size={27}/></button>
        <button disabled><MessageCircle size={20}/><span>消息</span></button>
        <button aria-current={page === '我' ? 'page' : undefined} onClick={()=>setPage('我')}><User size={20}/><span>我</span></button>
      </nav>
    </>}
  </div>;
}
