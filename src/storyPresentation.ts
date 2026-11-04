import type { Item, Runtime } from "./schema";
export function loveRevealed(state: Runtime): boolean {
  return state.unlocked.includes("interlude-love-open");
}
export function storyWallpaper(state: Runtime, locked: boolean): string {
  return locked ? "/wallpapers/lock.jpg" : loveRevealed(state) ? "/wallpapers/home.jpg" : "/wallpapers/before-love.jpg";
}
export function momentsPosts(items: Item[]): Item[] {
  return items.filter(i => i.folder === "朋友圈" || i.kind === "post")
    .sort((a,b) => Number(b.meta.momentOrder || 0) - Number(a.meta.momentOrder || 0));
}

export function hiddenAlbumUnlocked(state: Runtime): boolean {
  return state.variables.hiddenAlbumUnlocked === true;
}
