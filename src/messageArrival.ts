import { visible } from "./engine";
import type { Item, Runtime, Work } from "./schema";

const timedMessage = (id: string) => /^interlude-(phone-|call-zuo-|left-busy$)/.test(id);
export function stampMessageArrivals(work: Work, state: Runtime, now = new Date()): Runtime {
  if (work.id !== "phone-a-story") return state;
  const pending = (work.data.wechat ?? []).filter(item => timedMessage(item.id)
    && visible(item, state) && typeof state.ui?.wechat?.[`arrival:${item.id}`] !== "string");
  if (!pending.length) return state;
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const next = { ...state, ui: { ...state.ui, wechat: { ...state.ui?.wechat } } };
  for (const item of pending) next.ui.wechat[`arrival:${item.id}`] = time;
  return next;
}
export function messageArrivalTime(item: Item, state: Runtime): Item {
  const time = state.ui?.wechat?.[`arrival:${item.id}`];
  return timedMessage(item.id) && typeof time === "string" ? { ...item, time } : item;
}
