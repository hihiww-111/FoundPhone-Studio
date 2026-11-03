import { dispatch } from "./engine";
import { makeItem, type Runtime, type Work } from "./schema";

export function allChatsFree(state: Runtime): boolean {
  return ["interlude-love-final", "interlude-zhu-2", "interlude-zhang-2"].every(id => state.read.includes(id));
}

/** Only an explicitly sent, non-empty reply after reading Left's invitation advances the story. */
export function sendFreeReply(work: Work, state: Runtime, text: string, thread = "A左左"): Runtime {
  const completed = allChatsFree(state);
  const known = work.data.wechat?.some(i => i.title === thread && !["我", "朋友圈"].includes(i.folder));
  const leftReady = thread === "A左左" && state.unlocked.includes("interlude-love-open") && state.read.includes("interlude-love-open");
  if (!text.trim() || !known || (!completed && !leftReady)) return state;
  const next = structuredClone(state);
  const item = makeItem({title:thread, sender:"JI", avatar:"/wechat/avatar.jpg",
    body:text.trim(), time:"", outgoing:true, read:true,
    meta:{interlude:"true", ...(thread === "A左左" ? {pinned:"true"} : {})}});
  next.messages.wechat = [...(next.messages.wechat ?? []), item];
  next.unlocked.push(item.id);
  return thread === "A左左" && /喜欢|爱/.test(text) ? dispatch(work, next, "freeLove", "A左左") : next;
}
