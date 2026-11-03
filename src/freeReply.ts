import { dispatch } from "./engine";
import { makeItem, type Runtime, type Work } from "./schema";

/** Only an explicitly sent, non-empty reply after reading Left's invitation advances the story. */
export function sendFreeReply(work: Work, state: Runtime, text: string): Runtime {
  if (!text.trim() || !state.unlocked.includes("interlude-love-open") ||
      !state.read.includes("interlude-love-open")) return state;
  const next = structuredClone(state);
  const item = makeItem({title:"A左左", sender:"JI", avatar:"/wechat/avatar.jpg",
    body:text.trim(), time:"", outgoing:true, read:true,
    meta:{interlude:"true", pinned:"true"}});
  next.messages.wechat = [...(next.messages.wechat ?? []), item];
  next.unlocked.push(item.id);
  return /喜欢|爱/.test(text) ? dispatch(work, next, "freeLove", "A左左") : next;
}
