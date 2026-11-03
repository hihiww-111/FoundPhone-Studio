import { visible } from "./engine";
import type { Item, Runtime } from "./schema";

export function lockedNotePreview(item: Item, state: Runtime, workId: string): Item | null {
  if (workId !== "phone-a-story" || item.id !== "interlude-note" || visible(item, state)) return null;
  return { ...item, body: "", time: "", media: "", meta: { ...item.meta, lockedPreview: "true" } };
}
