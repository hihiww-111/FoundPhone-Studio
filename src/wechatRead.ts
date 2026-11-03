import { dispatch, visible } from "./engine";
import type { Runtime, Work } from "./schema";

export function readWechatThread(work: Work, state: Runtime, thread: string): Runtime {
  if (!thread) return state;
  // Snapshot only messages already visible in this conversation. New story
  // unlocks must be handled on the next render, not marked before arrival.
  const ids = [...(work.data.wechat ?? []), ...(state.messages.wechat ?? [])]
    .filter(item => item.title === thread && !["朋友圈", "我"].includes(item.folder)
      && !item.outgoing && !item.read && !state.read.includes(item.id) && visible(item, state))
    .map(item => item.id);
  return [...new Set(ids)].reduce((next, id) => dispatch(work, next, "read", id), state);
}
