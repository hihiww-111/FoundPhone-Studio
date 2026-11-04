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
  const confession = thread === "A左左" && /喜欢|爱/.test(text);
  const item = makeItem({title:thread, sender:"JI", avatar:"/wechat/avatar.jpg",
    body:text.trim(), time:"", outgoing:true, read:true,
    meta:{interlude:"true", freeMessage:"true", confession: String(confession), ...(thread === "A左左" ? {pinned:"true"} : {})}});
  next.messages.wechat = [...(next.messages.wechat ?? []), item];
  next.unlocked.push(item.id);
  if (thread !== "A左左") return next;
  next.variables.leftFreeMessageCount = next.messages.wechat.filter(i => i.title === "A左左" && i.outgoing && i.meta.confession !== "true" && !/喜欢|爱/.test(i.body)).length;
  const afterLove = /喜欢|爱/.test(text) ? dispatch(work, next, "freeLove", "A左左") : next;
  return dispatch(work, afterLove, "freeLeft", "A左左");
}
