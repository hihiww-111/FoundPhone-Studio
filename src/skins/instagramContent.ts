import { safeMedia, type Item } from "../schema";

export const instagramTabs = ["主页", "Reels", "个人主页"] as const;
export type InstagramTab = (typeof instagramTabs)[number];
export function instagramTab(value: string): InstagramTab {
  return instagramTabs.includes(value as InstagramTab)
    ? (value as InstagramTab)
    : "主页";
}
export function instagramContent(items: Item[], owner: string) {
  const visible = items.filter(
    (i) => i.folder !== "私信" && i.meta.profile !== "true",
  );
  const stories = visible.filter((i) => i.meta.story === "true");
  const allReels = visible.filter(
    (i) =>
      i.meta.story !== "true" &&
      i.kind === "video" &&
      (i.folder === "Reels" || i.meta.reel === "true"),
  );
  const posts = visible.filter(
    (i) => i.meta.story !== "true" && !allReels.includes(i),
  );
  const own = (i: Item) =>
    i.outgoing || i.sender === owner || i.meta.owner === "true";
  return {
    posts,
    reels: allReels.filter((i) => i.meta.profileReel !== "true"),
    profileReels: allReels.filter((i) => i.meta.profileReel === "true"),
    stories,
    ownPosts: posts.filter(own),
    ownReels: allReels.filter(own),
  };
}
export function instagramImages(item: Item): string[] {
  let images: unknown = [];
  try {
    images = JSON.parse(item.meta.images || "[]");
  } catch {
    /* Use the main image. */
  }
  const safe = Array.isArray(images)
    ? images.filter((s): s is string => typeof s === "string" && !!safeMedia(s))
    : [];
  return safe.length
    ? safe
    : item.kind === "image" && safeMedia(item.media)
      ? [item.media]
      : [];
}

export function reelSwipeTarget(
  index: number,
  count: number,
  dx: number,
  dy: number,
) {
  if (Math.abs(dy) < 45 || Math.abs(dy) <= Math.abs(dx)) return index;
  return Math.max(
    0,
    Math.min(Math.max(0, count - 1), index + (dy < 0 ? 1 : -1)),
  );
}

export function instagramReelStats(item: Item) {
  const commentsEnabled = item.meta.profileReel === "true";
  return {
    likes: commentsEnabled ? String(item.likes) : "999+",
    comments: commentsEnabled ? String(item.comments.length) : "99+",
    commentsEnabled,
  };
}
