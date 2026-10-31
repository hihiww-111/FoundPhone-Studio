import type { Item } from "../schema";

export function photoSequence(available: Item[], ids: string[]): Item[] {
  const byId = new Map(available.map((item) => [item.id, item]));
  return [...new Set(ids)].flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}

export function photoSwipeTarget(index: number, count: number, dx: number, dy: number) {
  if (Math.abs(dx) < 30 || Math.abs(dx) <= Math.abs(dy) * 1.2) return index;
  return Math.max(0, Math.min(count - 1, index + (dx < 0 ? 1 : -1)));
}
