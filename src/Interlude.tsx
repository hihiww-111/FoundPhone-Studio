import { useContext, useEffect, useRef, useState } from "react";
import { draftSequence } from "./draftSequence";
import { KeyboardContext, ScriptKeyboardContext } from "./DeviceSystem";
import type { Item } from "./schema";
import "./ios/interlude.css";

/** A reply is a draft until the reader explicitly presses Send. */
export function ScriptedReply({
  item,
  send,
  complete,
}: {
  item?: Item;
  send?: (id: string) => void;
  complete?: (id: string) => void;
}) {
  const [started, setStarted] = useState(false);
  const [draft, setDraft] = useState("");
  const openKeyboard = useContext(KeyboardContext);
  const keyboardDraft = useContext(ScriptKeyboardContext);
  const text = item?.meta.replyText || "";
  const eraseFirst = item?.meta.eraseFirst || "";
  const draftOnly = item?.meta.draftOnly === "true";
  const completion = useRef({ complete, id: item?.meta.replyId });
  completion.current = { complete, id: item?.meta.replyId };
  useEffect(() => {
    if (!started || !text) return;
    openKeyboard(true);
    const frames = draftSequence(text, eraseFirst);
    let index = 0;
    let timer: number;
    keyboardDraft("");
    const next = () => {
      const frame = frames[index++];
      setDraft(frame.text);
      keyboardDraft(frame.text);
      if (index < frames.length) timer = window.setTimeout(next, frame.delay);
      else if (draftOnly && completion.current.id)
        completion.current.complete?.(completion.current.id);
    };
    timer = window.setTimeout(next, 1000);
    return () => {
      window.clearTimeout(timer);
      keyboardDraft(null);
    };
  }, [started, text, eraseFirst, draftOnly, openKeyboard, keyboardDraft]);
  return (
    <div className="skin-compose scripted-compose">
      <button
        className="native-compose-field"
        aria-label="输入消息"
        disabled={!item}
        onClick={() => {
          setStarted(true);
          openKeyboard(true);
          keyboardDraft(draft);
        }}
      >
        {draft || ""}
      </button>
      <button
        className="story-send"
        disabled={draftOnly || !item || !text || draft !== text}
        onClick={() => {
          if (draftOnly || !item || draft !== text) return;
          send?.(item.meta.replyId);
          openKeyboard(false);
          keyboardDraft(null);
        }}
      >
        发送
      </button>
    </div>
  );
}

export function FreeReply({ send }: { send?: (text: string) => void }) {
  const [text, setText] = useState("");
  return <form className="skin-compose scripted-compose free-compose" onSubmit={e => {
    e.preventDefault();
    if (!text.trim()) return;
    send?.(text);
    setText("");
  }}>
    <input className="native-compose-field" aria-label="你想对左航说" placeholder="你想对左航说："
      value={text} onChange={e => setText(e.target.value)} />
    <button className="story-send" type="submit" disabled={!text.trim()}>发送</button>
  </form>;
}

export function MessageBanner({
  message,
  open,
}: {
  message?: Item;
  open: (item: Item) => void;
}) {
  const [expired, setExpired] = useState<string[]>([]);
  const id = message?.id;
  useEffect(() => {
    if (!id) return;
    const timer = window.setTimeout(() => setExpired((v) => [...v, id]), 6500);
    return () => window.clearTimeout(timer);
  }, [id]);
  if (!message || expired.includes(message.id)) return null;
  return (
    <div className="story-banner" role="status">
      <button className="story-banner-open" onClick={() => open(message)}>
        <img
          className="story-wechat-symbol"
          src="/icon-assets/wechat.jpg"
          alt="微信"
        />
        <span className="story-banner-content">
          <strong>{message.title}</strong>
          <span>{message.body}</span>
        </span>
        <time>现在</time>
      </button>
    </div>
  );
}

export type StoryRoute = {
  serial: number;
  app: string;
  thread?: string;
  note?: string;
};
export function useStoryRoute(
  route: StoryRoute | undefined,
  app: string,
  items: Item[],
  read: (id: string) => void,
  setDetail: (item: Item) => void,
  setThread: (name: string) => void,
) {
  const consumed = useRef(-1);
  useEffect(() => {
    if (!route || route.app !== app || consumed.current === route.serial)
      return;
    const note = route.note
      ? items.find((i) => i.id === route.note)
      : undefined;
    if (route.note && !note) return;
    consumed.current = route.serial;
    if (note) {
      setDetail(note);
      read(note.id);
    }
    if (route.thread) setThread(route.thread);
  }, [route, app, items, read, setDetail, setThread]);
}
