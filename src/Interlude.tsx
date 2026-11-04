import { usesNativeKeyboard } from "./nativeKeyboard";
import { queueMessageNotifications } from "./messageNotifications";
import { useContext, useEffect, useRef, useState } from "react";
import { draftSequence } from "./draftSequence";
import { FreeKeyboardContext, KeyboardContext, ScriptKeyboardContext } from "./DeviceSystem";
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
      openKeyboard(false);
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

export function FreeReply({ send, blank = false }: { send?: (text: string) => void; blank?: boolean }) {
  const [text, setText] = useState("");
  const bind = useContext(FreeKeyboardContext), open = useContext(KeyboardContext);
  const nativeInput = typeof navigator !== "undefined" && usesNativeKeyboard(navigator);
  const submit = (value: string) => { if (!value.trim()) return; send?.(value); setText(""); };
  const submitRef = useRef(submit); submitRef.current = submit;
  useEffect(() => { bind(nativeInput ? null : { text, change: setText, send: value => submitRef.current(value) }); }, [text, bind, nativeInput]);
  useEffect(() => () => { bind(null); open(false); }, [bind, open]);
  return <form data-native-keyboard={nativeInput} className="skin-compose scripted-compose free-compose" onSubmit={e => { e.preventDefault(); submit(text); }}>
    <input className="native-compose-field" inputMode={nativeInput ? "text" : "none"} enterKeyHint="send" aria-label={blank ? "输入消息" : "你想对左航说"} placeholder={blank ? "" : "你想对左航说："}
      value={text} onFocus={() => open(!nativeInput)} onClick={() => open(!nativeInput)} onChange={e => setText(e.target.value)} />
    <button className="story-send" type="submit" onPointerDown={e => e.preventDefault()} disabled={!text.trim()}>发送</button>
  </form>;
}

export function MessageBanner({ messages, activeThread, open }: {
  messages: Item[];
  activeThread: string;
  open: (item: Item) => void;
}) {
  const seen = useRef(new Set<string>());
  const [queue, setQueue] = useState<Item[]>([]);
  const key = messages.map(item => item.id).join("|");
  useEffect(() => {
    const previousSeen = new Set(seen.current);
    messages.forEach(item => seen.current.add(item.id));
    setQueue(previous => queueMessageNotifications(previous, messages, previousSeen, activeThread));
  }, [key, activeThread]);
  const message = queue[0];
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setQueue(previous => previous.slice(1)), 6500);
    return () => window.clearTimeout(timer);
  }, [message?.id]);
  if (!message) return null;
  return (
    <div className="story-banner" role="status">
      <button className="story-banner-open" onClick={() => open(message)}>
        <img decoding="async"
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
