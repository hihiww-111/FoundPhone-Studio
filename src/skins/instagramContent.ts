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
  const reels = visible.filter(
    (i) =>
      i.meta.story !== "true" &&
      i.kind === "video" &&
      (i.folder === "Reels" || i.meta.reel === "true"),
  );
  const posts = visible.filter(
    (i) => i.meta.story !== "true" && !reels.includes(i),
  );
  const own = (i: Item) =>
    i.outgoing || i.sender === owner || i.meta.owner === "true";
  return {
    posts,
    reels,
    stories,
    ownPosts: posts.filter(own),
    ownReels: reels.filter(own),
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

export function orderedInstagramReels(reels: Item[], order: string[]): Item[] {
  const byId = new Map(reels.map((item) => [item.id, item]));
  const ids = [...new Set([...order, ...reels.map((item) => item.id)])];
  return ids.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}
export function moveInstagramReel(
  ids: string[],
  id: string,
  target: number,
): string[] {
  const from = ids.indexOf(id);
  if (from < 0) return ids;
  const next = [...ids];
  next.splice(from, 1);
  next.splice(Math.max(0, Math.min(next.length, target)), 0, id);
  return next;
}
