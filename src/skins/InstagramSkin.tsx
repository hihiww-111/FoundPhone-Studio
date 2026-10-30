import { useEffect, useRef, useState } from "react";
import { useIsPresent } from "motion/react";
import {
  ArrowLeft,
  Bookmark,
  Check,
  ChevronDown,
  Clapperboard,
  Grid3X3,
  GripVertical,
  ChevronUp,
  Heart,
  Home,
  Image as ImageIcon,
  LockKeyhole,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Play,
  Plus,
  Send,
  UserRound,
  UserRoundPlus,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { SkinProps } from "../AppSkins";
import { safeMedia, type Item } from "../schema";
import { useSkinState } from "../skinState";
import {
  instagramContent,
  orderedInstagramReels,
  moveInstagramReel,
  instagramImages,
  instagramTab,
  instagramTabs,
  type InstagramTab,
} from "./instagramContent";
import "./instagram.css";

function Avatar({
  name,
  src = "",
  own = false,
}: {
  name: string;
  src?: string;
  own?: boolean;
}) {
  return (
    <span className="ins-avatar">
      {safeMedia(src) || own ? (
        <img src={safeMedia(src) || "/settings-avatar.jpg"} alt="" />
      ) : (
        <span>{name.slice(0, 1)}</span>
      )}
    </span>
  );
}
function PostMedia({ item }: { item: Item }) {
  const images = instagramImages(item);
  const [index, setIndex] = useState(0);
  if (item.kind === "video" && safeMedia(item.media))
    return (
      <video
        className="ins-feed-video"
        src={safeMedia(item.media)}
        controls
        playsInline
        preload="none"
      />
    );
  if (!images.length)
    return (
      <div className="ins-media-empty">
        <ImageIcon size={38} />
        <span>{item.title}</span>
      </div>
    );
  return (
    <>
      <div
        className="ins-carousel"
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
      >
        {images.map((src, n) => (
          <img key={`${n}-${src}`} src={src} alt={item.title} loading="lazy" />
        ))}
      </div>
      {images.length > 1 && (
        <div
          className="ins-dots"
          aria-label={`第 ${index + 1} 张，共 ${images.length} 张`}
        >
          {images.map((_, n) => (
            <i key={n} className={n === index ? "active" : ""} />
          ))}
        </div>
      )}
    </>
  );
}
function ReelVideo({
  item,
  active,
  muted,
  onMute,
}: {
  item: Item;
  active: boolean;
  muted: boolean;
  onMute: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);
  const [failed, setFailed] = useState(false);
  const manuallyPaused = useRef(false);
  const source = safeMedia(item.media);
  useEffect(() => {
    const video = ref.current;
    if (!video || !source) return;
    const start = () => {
      void video.play().catch(() => setPaused(true));
    };
    const visibility = () => {
      if (document.hidden) video.pause();
      else if (active && !manuallyPaused.current) start();
    };
    if (active && !document.hidden && !manuallyPaused.current) start();
    else video.pause();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      video.pause();
    };
  }, [active, source]);
  return (
    <>
      {source && !failed ? (
        <video
          ref={ref}
          src={source}
          poster={safeMedia(item.meta.cover)}
          muted={muted}
          loop
          playsInline
          preload={active ? "metadata" : "none"}
          onError={() => setFailed(true)}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
        />
      ) : (
        <div className="ins-reel-unavailable">
          <Clapperboard size={48} />
          <p>视频暂时无法播放</p>
        </div>
      )}
      <button
        className="ins-reel-tap"
        aria-label={paused ? `播放${item.title}` : `暂停${item.title}`}
        onClick={() => {
          const video = ref.current;
          if (!video) return;
          if (video.paused) {
            manuallyPaused.current = false;
            void video.play().catch(() => setPaused(true));
          } else {
            manuallyPaused.current = true;
            video.pause();
          }
        }}
      >
        {paused && <Play size={48} fill="white" />}
      </button>
      <button
        className="ins-reel-volume"
        aria-label={muted ? "开启视频声音" : "静音视频"}
        onClick={onMute}
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </>
  );
}

export function InstagramSkin(p: SkinProps) {
  const present = useIsPresent();
  const [storedTab, setStoredTab] = useSkinState<string>(p, "mymyTab", "主页");
  const tab = instagramTab(storedTab);
  const [liked, setLiked] = useSkinState<string[]>(p, "mymyLiked", []);
  const [saved, setSaved] = useSkinState<string[]>(p, "mymySaved", []);
  const [replies, setReplies] = useSkinState<string[]>(p, "mymyReplies", []);
  const [seen, setSeen] = useSkinState<string[]>(p, "mymySeen", []);
  const [following, setFollowing] = useSkinState<string[]>(
    p,
    "insFollowing",
    [],
  );
  const [reelOrder, setReelOrder] = useSkinState<string[]>(
    p,
    "insReelOrder",
    [],
  );
  const draggingReel = useRef<string | null>(null);
  const [storedReel, setStoredReel] = useSkinState<number>(p, "insReel", 0);
  const [profileName, setProfileName] = useSkinState<string>(
    p,
    "insProfileName",
    p.owner || "机主",
  );
  const [bio, setBio] = useSkinState<string>(p, "insBio", "");
  const [profileView, setProfileView] = useState("帖子");
  const [selected, setSelected] = useState<Item | null>(null);
  const [comments, setComments] = useState<Item | null>(null);
  const [sheet, setSheet] = useState("");
  const [draft, setDraft] = useState("");
  const [story, setStory] = useState<Item | null>(null);
  const [muted, setMuted] = useState(true);
  const [notice, setNotice] = useState("");
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const reelScroll = useRef<HTMLDivElement>(null);
  const {
    posts,
    reels: authoredReels,
    stories,
    ownPosts,
    ownReels,
  } = instagramContent(p.items, p.owner || "机主");
  const reels = orderedInstagramReels(authoredReels, reelOrder);
  const reelOrderKey = reels.map((i) => i.id).join("|");
  const profile = p.items.find((i) => i.meta.profile === "true");
  const username = profile?.meta.username || p.owner || "机主";
  const ownAvatar = profile?.avatar || "";
  const activeReel = Math.max(
    0,
    Math.min(reels.length - 1, Math.floor(storedReel) || 0),
  );
  const moveReel = (id: string, target: number) => {
    const activeId = reels[activeReel]?.id;
    const next = moveInstagramReel(
      reels.map((i) => i.id),
      id,
      target,
    );
    setReelOrder(next);
    setStoredReel(Math.max(0, next.indexOf(activeId)));
  };
  const authorPosts = posts.filter((i) => i.sender && i.sender !== p.owner);
  const people = authorPosts.filter(
    (i, n) => authorPosts.findIndex((other) => other.sender === i.sender) === n,
  );
  const toggle = (
    id: string,
    values: string[],
    set: (next: string[]) => void,
  ) =>
    set(values.includes(id) ? values.filter((v) => v !== id) : [...values, id]);
  const read = (i: Item) => {
    if (!p.creator) p.onRead(i.id);
  };
  const openPost = (i: Item) => {
    if (p.creator || i.password) p.onItem(i);
    else {
      read(i);
      setSelected(i);
    }
  };
  const changeTab = (next: InstagramTab) => {
    setSelected(null);
    setComments(null);
    setSheet("");
    setStory(null);
    setStoredTab(next);
  };
  const share = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("已复制");
    } catch {
      setNotice("暂时无法复制，请稍后重试");
    }
  };
  const openStory = (i: Item) => {
    if (i.password || p.creator) {
      p.onItem(i);
      return;
    }
    read(i);
    setSeen([...new Set([...seen, i.id])]);
    setStory(i);
  };
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2200);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (tab === "Reels" && reelScroll.current)
      reelScroll.current.scrollTop =
        activeReel * reelScroll.current.clientHeight;
  }, [tab, reelOrderKey]);
  useEffect(() => {
    if (tab === "Reels" && reels[activeReel] && !p.creator)
      p.onRead(reels[activeReel].id);
  }, [tab, reels[activeReel]?.id]);
  const commentCount = (i: Item) =>
    i.comments.length + replies.filter((r) => r.startsWith(i.id + "\t")).length;
  const openComments = (i: Item) => {
    read(i);
    setDraft("");
    setComments(i);
  };
  const post = (i: Item) => (
    <article className="ins-post" key={i.id}>
      <header className="ins-post-header">
        <Avatar name={i.sender} src={i.avatar} />
        <div>
          <strong>{i.sender || profileName}</strong>
          <small>
            {i.meta.music ? (
              <>
                <Music2 size={11} /> {i.meta.music}
              </>
            ) : (
              i.meta.location || i.time
            )}
          </small>
        </div>
        <button
          aria-label={`帖子详情${i.title}`}
          onClick={() => {
            read(i);
            setSheet("帖子选项");
          }}
        >
          <MoreHorizontal size={22} />
        </button>
      </header>
      <div
        className="ins-post-media"
        onDoubleClick={() => {
          if (!liked.includes(i.id)) setLiked([...liked, i.id]);
        }}
      >
        <PostMedia item={i} />
      </div>
      <div className="ins-post-actions">
        <button
          aria-label={`点赞${i.title}`}
          aria-pressed={liked.includes(i.id)}
          onClick={() => toggle(i.id, liked, setLiked)}
        >
          <Heart
            fill={liked.includes(i.id) ? "#ff3040" : "none"}
            color={liked.includes(i.id) ? "#ff3040" : "currentColor"}
          />
        </button>
        <button aria-label={`评论${i.title}`} onClick={() => openComments(i)}>
          <MessageCircle />
        </button>
        <button
          aria-label={`复制帖子${i.title}`}
          onClick={() => void share(`${i.sender}\n${i.body}`)}
        >
          <Send />
        </button>
        <button
          className="ins-save"
          aria-label={`收藏${i.title}`}
          aria-pressed={saved.includes(i.id)}
          onClick={() => toggle(i.id, saved, setSaved)}
        >
          <Bookmark fill={saved.includes(i.id) ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="ins-caption">
        <strong>{i.likes + (liked.includes(i.id) ? 1 : 0)} 次赞</strong>
        <p>
          <b>{i.sender}</b> {i.body}
        </p>
        <button onClick={() => openComments(i)}>
          查看全部 {commentCount(i)} 条评论
        </button>
        <time>{i.time}</time>
      </div>
    </article>
  );
  const grid = (items: Item[]) => (
    <div className="ins-grid pg2">
      {items.map((i) => (
        <button
          key={i.id}
          aria-label={`查看${i.title}`}
          onClick={() => {
            const index = reels.findIndex((r) => r.id === i.id);
            if (index >= 0) {
              setStoredReel(index);
              changeTab("Reels");
            } else openPost(i);
          }}
        >
          {instagramImages(i)[0] || safeMedia(i.meta.cover) ? (
            <img
              src={instagramImages(i)[0] || safeMedia(i.meta.cover)}
              alt={i.title}
              loading="lazy"
            />
          ) : (
            <span>{i.kind === "video" ? <Clapperboard /> : <ImageIcon />}</span>
          )}
          {i.kind === "video" && (
            <Clapperboard className="ins-grid-badge" size={17} />
          )}
        </button>
      ))}
    </div>
  );
  return (
    <div className="instagram-app" data-mymy="instagram" data-ins-tab={tab}>
      {tab !== "Reels" && (
        <header className="ins-header">
          <button
            aria-label={selected ? "返回Instagram动态" : "新建内容"}
            onClick={() =>
              selected
                ? setSelected(null)
                : p.creator
                  ? p.onAdd()
                  : setNotice("暂时没有可发布的内容")
            }
          >
            {selected ? <ArrowLeft /> : <Plus size={28} />}
          </button>
          <h1 className={tab === "主页" && !selected ? "ins-wordmark" : ""}>
            {selected ? (
              "帖子"
            ) : tab === "主页" ? (
              <>
                Instagram <ChevronDown size={14} />
              </>
            ) : (
              <>
                <LockKeyhole size={14} /> {username} <ChevronDown size={14} />
              </>
            )}
          </h1>
          <button
            aria-label={tab === "主页" ? "动态通知" : "个人主页菜单"}
            onClick={() => setSheet(tab === "主页" ? "动态通知" : "菜单")}
          >
            {tab === "主页" ? <Heart /> : <Menu />}
          </button>
        </header>
      )}
      {tab !== "Reels" && (
        <div className="ins-scroll" key={`${tab}-${selected?.id || "root"}`}>
          {selected ? (
            post(selected)
          ) : tab === "主页" ? (
            <>
              <div className="ins-stories">
                <button
                  className="ins-own-story"
                  onClick={() => {
                    const own = stories.find(
                      (i) => i.sender === p.owner || i.outgoing,
                    );
                    if (own) openStory(own);
                    else setNotice("还没有快拍");
                  }}
                >
                  <span>
                    <Avatar name={profileName} src={ownAvatar} own />
                    <i>
                      <Plus size={12} />
                    </i>
                  </span>
                  <small>你的快拍</small>
                </button>
                {stories.map((i) => (
                  <button
                    className="ins-story-ring st"
                    key={i.id}
                    onClick={() => openStory(i)}
                  >
                    <span className={seen.includes(i.id) ? "seen" : ""}>
                      <Avatar name={i.sender} src={i.avatar} />
                    </span>
                    <small>{i.sender}</small>
                  </button>
                ))}
              </div>
              {posts.map(post)}
              {!posts.length && (
                <div className="ins-empty">
                  <ImageIcon size={42} />
                  <h2>还没有动态</h2>
                  <p>关注的动态会显示在这里</p>
                </div>
              )}
            </>
          ) : (
            <>
              <section className="ins-profile">
                <div className="ins-profile-row">
                  <Avatar name={profileName} src={ownAvatar} own />
                  <div className="ins-profile-summary">
                    <strong>{profileName}</strong>
                    <div className="ins-profile-stats">
                      <span>
                        <b>{ownPosts.length}</b>帖子
                      </span>
                      <span>
                        <b>{profile?.meta.followers || "—"}</b>粉丝
                      </span>
                      <span>
                        <b>{profile?.meta.following || "—"}</b>关注
                      </span>
                    </div>
                  </div>
                </div>
                {(bio || profile?.body) && (
                  <p className="ins-bio">{bio || profile?.body}</p>
                )}
                <div className="ins-profile-actions">
                  <button
                    onClick={() => {
                      setEditName(profileName);
                      setEditBio(bio || profile?.body || "");
                      setSheet("编辑个人资料");
                    }}
                  >
                    编辑个人资料
                  </button>
                  <button
                    onClick={() =>
                      void share(`${username}\n${bio || profile?.body || ""}`)
                    }
                  >
                    分享主页
                  </button>
                  <button
                    aria-label="发现用户"
                    onClick={() => setSheet("发现用户")}
                  >
                    <UserRoundPlus size={20} />
                  </button>
                </div>
              </section>
              {people.length > 0 && (
                <section className="ins-discover">
                  <div>
                    <strong>发现用户</strong>
                    <button onClick={() => setSheet("发现用户")}>
                      查看全部
                    </button>
                  </div>
                  <div className="ins-people">
                    {people.map((i) => (
                      <article key={i.sender}>
                        <Avatar name={i.sender} src={i.avatar} />
                        <b>{i.sender}</b>
                        <button
                          onClick={() =>
                            toggle(i.sender, following, setFollowing)
                          }
                        >
                          {following.includes(i.sender) ? "已关注" : "关注"}
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              )}
              <div className="ins-highlights">
                <button onClick={() => setNotice("还没有精选快拍")}>
                  <span>
                    <Plus size={28} />
                  </span>
                  <small>新建</small>
                </button>
                {stories
                  .filter((i) => i.outgoing || i.sender === p.owner)
                  .map((i) => (
                    <button key={i.id} onClick={() => openStory(i)}>
                      <Avatar name={i.sender} src={i.avatar} />
                      <small>{i.title}</small>
                    </button>
                  ))}
              </div>
              <div
                className="ins-profile-tabs"
                role="tablist"
                aria-label="个人主页内容"
              >
                {[
                  ["帖子", Grid3X3],
                  ["Reels", Clapperboard],
                  ["标记", UserRound],
                ].map(([name, Icon]) => {
                  const Glyph = Icon as typeof Grid3X3;
                  return (
                    <button
                      key={name as string}
                      role="tab"
                      aria-selected={profileView === name}
                      aria-label={name as string}
                      onClick={() => setProfileView(name as string)}
                    >
                      <Glyph size={23} />
                    </button>
                  );
                })}
              </div>
              {grid(
                profileView === "帖子"
                  ? ownPosts
                  : profileView === "Reels"
                    ? ownReels
                    : posts.filter((i) => i.meta.tagged === "true"),
              )}
              {(profileView === "帖子"
                ? ownPosts
                : profileView === "Reels"
                  ? ownReels
                  : posts.filter((i) => i.meta.tagged === "true")
              ).length === 0 && (
                <div className="ins-empty">
                  <Grid3X3 size={36} />
                  <h2>
                    还没有
                    {profileView === "帖子"
                      ? "帖子"
                      : profileView === "Reels"
                        ? "Reels"
                        : "标记"}
                  </h2>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {tab === "Reels" && (
        <>
          <header className="ins-reels-header">
            <h1>Reels</h1>
            <span>朋友</span>
            <button
              aria-label="调整视频顺序"
              onClick={() => setSheet("视频顺序")}
            >
              <Menu size={22} />
            </button>
          </header>
          <div
            className="ins-reels-scroll"
            ref={reelScroll}
            role="region"
            aria-label="Reels短视频"
            tabIndex={0}
            onScroll={(e) => {
              const el = e.currentTarget;
              const n = Math.max(
                0,
                Math.min(
                  reels.length - 1,
                  Math.round(el.scrollTop / Math.max(1, el.clientHeight)),
                ),
              );
              if (n !== activeReel) setStoredReel(n);
            }}
            onKeyDown={(e) => {
              if (
                ["ArrowDown", "ArrowUp", "PageDown", "PageUp"].includes(e.key)
              ) {
                e.preventDefault();
                const next = Math.max(
                  0,
                  Math.min(
                    reels.length - 1,
                    activeReel +
                      (["ArrowDown", "PageDown"].includes(e.key) ? 1 : -1),
                  ),
                );
                e.currentTarget.scrollTo({
                  top: next * e.currentTarget.clientHeight,
                  behavior: "smooth",
                });
              }
            }}
          >
            {!reels.length && (
              <div className="ins-empty ins-reels-empty">
                <Clapperboard size={48} />
                <h2>还没有 Reels</h2>
                <p>短视频会显示在这里</p>
              </div>
            )}
            {reels.map((i, n) => (
              <article
                key={i.id}
                className="ins-reel"
                aria-label={`Reel ${n + 1}：${i.title}`}
                data-active={n === activeReel}
              >
                <ReelVideo
                  item={i}
                  active={n === activeReel && !comments && !sheet && present}
                  muted={muted}
                  onMute={() => setMuted(!muted)}
                />
                <div className="ins-reel-gradient" />
                <div className="ins-reel-actions">
                  <button
                    aria-label={`点赞${i.title}`}
                    aria-pressed={liked.includes(i.id)}
                    onClick={() => toggle(i.id, liked, setLiked)}
                  >
                    <Heart fill={liked.includes(i.id) ? "#ff3040" : "none"} />
                    <small>{i.likes + (liked.includes(i.id) ? 1 : 0)}</small>
                  </button>
                  <button
                    aria-label={`评论${i.title}`}
                    onClick={() => openComments(i)}
                  >
                    <MessageCircle />
                    <small>{commentCount(i)}</small>
                  </button>
                  <button
                    aria-label={`收藏${i.title}`}
                    aria-pressed={saved.includes(i.id)}
                    onClick={() => toggle(i.id, saved, setSaved)}
                  >
                    <Bookmark fill={saved.includes(i.id) ? "white" : "none"} />
                  </button>
                  <button
                    aria-label={`复制视频${i.title}`}
                    onClick={() => void share(`${i.sender}\n${i.body}`)}
                  >
                    <Send />
                  </button>
                  <button
                    aria-label={`视频选项${i.title}`}
                    onClick={() => setSheet("帖子选项")}
                  >
                    <MoreHorizontal />
                  </button>
                </div>
                <div className="ins-reel-caption">
                  <div>
                    <Avatar name={i.sender || "Reels"} src={i.avatar} />
                    <strong>{i.sender || "Reels"}</strong>
                    {i.sender && (
                      <button
                        onClick={() =>
                          toggle(i.sender, following, setFollowing)
                        }
                      >
                        {following.includes(i.sender) ? "已关注" : "关注"}
                      </button>
                    )}
                  </div>
                  <p>{i.body}</p>
                  {i.meta.music && (
                    <small>
                      <Music2 size={13} /> {i.meta.music}
                    </small>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      <nav className="ins-bottom-nav" aria-label="Instagram导航">
        {instagramTabs.map((name) => (
          <button
            key={name}
            aria-label={name}
            aria-pressed={tab === name && !selected}
            onClick={() => changeTab(name)}
          >
            {name === "主页" ? (
              <Home fill={tab === name ? "currentColor" : "none"} />
            ) : name === "Reels" ? (
              <Clapperboard fill={tab === name ? "currentColor" : "none"} />
            ) : (
              <Avatar name={profileName} src={ownAvatar} own />
            )}
          </button>
        ))}
      </nav>
      {comments && (
        <div className="ins-overlay">
          <button
            className="ins-backdrop"
            aria-label="关闭评论"
            onClick={() => setComments(null)}
          />
          <section
            className="ins-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Instagram评论"
          >
            <header>
              <b>评论</b>
              <button
                aria-label="关闭评论面板"
                onClick={() => setComments(null)}
              >
                <X />
              </button>
            </header>
            <div className="ins-comments mymy-comments">
              {[
                ...comments.comments,
                ...replies
                  .filter((r) => r.startsWith(comments.id + "\t"))
                  .map((r) => r.slice(comments.id.length + 1)),
              ].map((text, n) => (
                <p key={n}>
                  <Avatar name={text.split(":")[0]} />
                  <span>{text}</span>
                </p>
              ))}
              {!commentCount(comments) && <p>还没有评论</p>}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.trim()) return;
                setReplies([...replies, comments.id + "\t" + draft.trim()]);
                setDraft("");
              }}
            >
              <input
                aria-label="添加评论"
                placeholder="添加评论…"
                maxLength={500}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button disabled={!draft.trim()}>发布</button>
            </form>
          </section>
        </div>
      )}
      {sheet && (
        <div className="ins-overlay">
          <button
            className="ins-backdrop"
            aria-label="关闭面板"
            onClick={() => setSheet("")}
          />
          <section
            className="ins-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={sheet}
          >
            <header>
              <b>{sheet}</b>
              <button aria-label="关闭面板内容" onClick={() => setSheet("")}>
                <X />
              </button>
            </header>
            {sheet === "视频顺序" ? (
              <div className="ins-reorder-list">
                <p>拖动左侧图标，或用上下箭头调整播放顺序。</p>
                {reels.map((item, n) => (
                  <div
                    className="ins-reorder-row"
                    key={item.id}
                    data-reel-sort-id={item.id}
                  >
                    <button
                      className="ins-drag-handle"
                      aria-label={`拖动${item.title}调整顺序`}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        draggingReel.current = item.id;
                        e.currentTarget.setPointerCapture(e.pointerId);
                      }}
                      onPointerMove={(e) => {
                        if (!draggingReel.current) return;
                        const row = document
                          .elementFromPoint(e.clientX, e.clientY)
                          ?.closest<HTMLElement>("[data-reel-sort-id]");
                        const index = reels.findIndex(
                          (i) => i.id === row?.dataset.reelSortId,
                        );
                        if (
                          index >= 0 &&
                          row?.dataset.reelSortId !== draggingReel.current
                        )
                          moveReel(draggingReel.current, index);
                      }}
                      onPointerUp={() => {
                        draggingReel.current = null;
                      }}
                      onPointerCancel={() => {
                        draggingReel.current = null;
                      }}
                      onLostPointerCapture={() => {
                        draggingReel.current = null;
                      }}
                    >
                      <GripVertical size={20} />
                    </button>
                    <span className="ins-reorder-number">{n + 1}</span>
                    {safeMedia(item.meta.cover) && (
                      <img
                        className="ins-reorder-thumb"
                        src={safeMedia(item.meta.cover)}
                        alt=""
                      />
                    )}
                    <strong>{item.title}</strong>
                    <button
                      aria-label={`上移${item.title}`}
                      disabled={n === 0}
                      onClick={() => moveReel(item.id, n - 1)}
                    >
                      <ChevronUp size={19} />
                    </button>
                    <button
                      aria-label={`下移${item.title}`}
                      disabled={n === reels.length - 1}
                      onClick={() => moveReel(item.id, n + 1)}
                    >
                      <ChevronDown size={19} />
                    </button>
                  </div>
                ))}
                <button
                  className="ins-order-reset"
                  onClick={() => {
                    const activeId = reels[activeReel]?.id;
                    setReelOrder([]);
                    setStoredReel(
                      Math.max(
                        0,
                        authoredReels.findIndex((i) => i.id === activeId),
                      ),
                    );
                  }}
                >
                  恢复默认顺序
                </button>
                <button className="ins-order-done" onClick={() => setSheet("")}>
                  完成
                </button>
              </div>
            ) : sheet === "编辑个人资料" ? (
              <form
                className="ins-edit-profile"
                onSubmit={(e) => {
                  e.preventDefault();
                  setProfileName(editName.trim() || p.owner || "机主");
                  setBio(editBio.trim());
                  setSheet("");
                }}
              >
                <label>
                  名字
                  <input
                    value={editName}
                    maxLength={50}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </label>
                <label>
                  简介
                  <textarea
                    value={editBio}
                    maxLength={150}
                    onChange={(e) => setEditBio(e.target.value)}
                  />
                </label>
                <button>
                  <Check size={17} />
                  完成
                </button>
              </form>
            ) : sheet === "菜单" ? (
              <button
                className="ins-menu-row"
                onClick={() => setSheet("已收藏")}
              >
                <Bookmark />
                已收藏
              </button>
            ) : sheet === "已收藏" ? (
              <div className="ins-saved">
                {posts
                  .filter((i) => saved.includes(i.id))
                  .map((i) => (
                    <button
                      key={i.id}
                      onClick={() => {
                        setSelected(i);
                        setSheet("");
                      }}
                    >
                      {i.title}
                    </button>
                  ))}
                {!saved.length && <p>还没有收藏</p>}
              </div>
            ) : sheet === "发现用户" ? (
              <div className="ins-saved">
                {people.map((i) => (
                  <button
                    key={i.sender}
                    onClick={() => toggle(i.sender, following, setFollowing)}
                  >
                    <Avatar name={i.sender} src={i.avatar} />
                    {i.sender}
                    <span>
                      {following.includes(i.sender) ? "已关注" : "关注"}
                    </span>
                  </button>
                ))}
                {!people.length && <p>暂时没有推荐用户</p>}
              </div>
            ) : (
              <p className="ins-sheet-note">
                {sheet === "动态通知"
                  ? "还没有新通知"
                  : "长按或点击下方图标可收藏、点赞和评论"}
              </p>
            )}
          </section>
        </div>
      )}
      {story && (
        <div className="ins-story-view mymy-story">
          <header>
            <Avatar name={story.sender} src={story.avatar} />
            <strong>{story.sender}</strong>
            <button aria-label="关闭快拍" onClick={() => setStory(null)}>
              <X />
            </button>
          </header>
          {story.kind === "video" && safeMedia(story.media) ? (
            <video src={safeMedia(story.media)} controls playsInline />
          ) : (
            <PostMedia item={story} />
          )}
          <p>{story.body}</p>
        </div>
      )}
      {notice && (
        <div className="ins-toast" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
