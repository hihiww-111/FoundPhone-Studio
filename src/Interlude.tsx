import { useContext, useEffect, useRef, useState } from "react";
import { KeyboardContext, ScriptKeyboardContext } from "./DeviceSystem";
import type { Item } from "./schema";
import "./ios/interlude.css";

/** A reply is a draft until the reader explicitly presses Send. */
export function ScriptedReply({ item, send }: { item?: Item; send?: (id: string) => void }) {
  const [started, setStarted] = useState(item?.meta.autoType === "true");
  const [draft, setDraft] = useState("");
  const openKeyboard = useContext(KeyboardContext);
  const keyboardDraft = useContext(ScriptKeyboardContext);
  const text = item?.meta.replyText || "";
  useEffect(() => {
    if (!started || !text) return;
    openKeyboard(true);
    const characters = Array.from(text);
    let count = 0;
    keyboardDraft("");
    const timer = window.setInterval(() => {
      count++;
      const value = characters.slice(0, count).join("");
      setDraft(value);
      keyboardDraft(value);
      if (count >= characters.length) window.clearInterval(timer);
    }, 110);
    return () => { window.clearInterval(timer); keyboardDraft(null); };
  }, [started, text, openKeyboard, keyboardDraft]);
  return <div className="skin-compose scripted-compose">
    <button className="native-compose-field" aria-label="输入消息" disabled={!item}
      onClick={() => { setStarted(true); openKeyboard(true); keyboardDraft(draft); }}>{draft || ""}</button>
    <button className="story-send" disabled={!item || !text || draft !== text} onClick={() => {
      if (!item || draft !== text) return;
      send?.(item.meta.replyId);
      openKeyboard(false);
      keyboardDraft(null);
    }}>发送</button>
  </div>;
}

export function MessageBanner({ message, open }: { message?: Item; open: (item: Item) => void }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [expired, setExpired] = useState<string[]>([]);
  const id = message?.id;
  useEffect(() => {
    if (!id) return;
    const timer = window.setTimeout(() => setExpired(v => [...v,id]), 6500);
    return () => window.clearTimeout(timer);
  }, [id]);
  if (!message || expired.includes(message.id) || dismissed.includes(message.id)) return null;
  return <div className="story-banner" role="status">
    <button className="story-banner-open" onClick={() => open(message)}>
      <span className="story-wechat-symbol">微信</span><span><small>微信 · 现在</small><strong>{message.title}</strong><span>{message.body}</span></span>
    </button><button className="story-banner-close" aria-label="关闭新消息通知" onClick={() => setDismissed(v => [...v,message.id])}>×</button>
  </div>;
}

export type StoryRoute = { serial: number; app: string; thread?: string; note?: string };
export function useStoryRoute(route: StoryRoute | undefined, app: string, items: Item[], read: (id: string) => void, setDetail: (item: Item) => void, setThread: (name: string) => void) {
  const consumed = useRef(-1);
  useEffect(() => {
    if (!route || route.app !== app || consumed.current === route.serial) return;
    const note = route.note ? items.find(i => i.id === route.note) : undefined;
    if (route.note && !note) return;
    consumed.current = route.serial;
    if (note) { setDetail(note); read(note.id); }
    if (route.thread) setThread(route.thread);
  }, [route, app, items, read, setDetail, setThread]);
}
