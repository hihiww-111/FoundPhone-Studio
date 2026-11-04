import { foregroundTimeout } from "./foregroundTime";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import {
  Clock,
  Grid3X3,
  MicOff,
  Phone,
  Plus,
  Search,
  Users,
  Video,
  Volume2,
} from "lucide-react";
import type { Item, Runtime, Work } from "./schema";
import { useMusicPlayback } from "./MusicPlayback";
import {
  callRecords,
  endPhoneCall,
  firstContactGlyph,
  startPhoneCall,
  type CallRecord,
} from "./phoneCalls";
import "./ios/story-phone.css";

type Calls = { dial: (name: string) => void; records: CallRecord[] };
export const PhoneCallContext = createContext<Calls | null>(null);

export function usePhoneCalls(
  work: Work,
  state: Runtime,
  runtime: MutableRefObject<Runtime>,
  update: (state: Runtime) => void,
  currentRuntime: () => Runtime,
) {
  const audio = useRef<HTMLAudioElement>(null);
  const music = useMusicPlayback();
  const [notice, setNotice] = useState("");
  const [blockedAudio, setBlockedAudio] = useState(false);
  const latest = useRef({ work, runtime, update, currentRuntime });
  latest.current = { work, runtime, update, currentRuntime };
  const active = String(state.ui?.phone?.activeName || "");
  const play = () => {
    if (!audio.current) return;
    void audio.current
      .play()
      .then(() => setBlockedAudio(false))
      .catch(() => setBlockedAudio(true));
  };
  const end = (remote = false) => {
    audio.current?.pause();
    const current = currentRuntime();
    const name = String(current.ui?.phone?.activeName || "");
    update(endPhoneCall(work, current, remote));
    if (name)
      setNotice(
        `已添加通话记录：${name} · ${remote ? "对方已挂断" : "已取消"}`,
      );
  };
  useEffect(() => {
    const code = String(state.ui?.phone?.activeContactId || "");
    const first = !!state.ui?.phone?.firstAttempt;
    const expired = first
      ? code === "cat"
        ? state.variables.firstCatCallEnded
        : state.variables["phoneAutoEnded-" + code]
      : state.variables.phoneRepeatExpired;
    if (!active || !expired) return;
    audio.current?.pause();
    const current = latest.current;
    current.update(endPhoneCall(current.work, current.currentRuntime(), true));
    setNotice(`已添加通话记录：${active} · 对方已挂断`);
  }, [
    active,
    state.variables,
    state.ui?.phone?.firstAttempt,
    state.ui?.phone?.activeContactId,
  ]);
  useEffect(() => {
    if (!active) {
      audio.current?.pause();
      return;
    }
    // Handles restoring an in-progress call; the visible retry respects Safari autoplay rules.
    void audio.current
      ?.play()
      .then(() => setBlockedAudio(false))
      .catch(() => setBlockedAudio(true));
    return () => {
      audio.current?.pause();
    };
  }, [active]);
  useEffect(() => {
    if (!notice) return;
    return foregroundTimeout(() => setNotice(""), 4000);
  }, [notice]);
  const dial = (name: string) => {
    const current = currentRuntime();
    const next = startPhoneCall(work, current, name, crypto.randomUUID());
    if (next === current) return;
    if (music.playing) music.toggle();
    update(next);
    setNotice("");
    if (audio.current) {
      audio.current.currentTime = 0;
      play();
    }
  };
  return {
    context: { dial, records: callRecords(state) },
    overlay: (
      <>
        <audio
          ref={audio}
          data-phone-ringback
          src="/music/racing-game.mp3"
          preload="none"
          loop
        />
        {active && (
          <OutgoingCall
            key={String(state.ui?.phone?.activeId)}
            name={active}
            end={() => end()}
            audioBlocked={blockedAudio}
            retry={play}
            volume={(loud) => {
              if (audio.current) audio.current.volume = loud ? 1 : 0.6;
            }}
          />
        )}
        {notice && (
          <div className="phone-record-notice" role="status">
            {notice}
          </div>
        )}
      </>
    ),
  };
}

function OutgoingCall({
  name,
  end,
  audioBlocked,
  retry,
  volume,
}: {
  name: string;
  end: () => void;
  audioBlocked: boolean;
  retry: () => void;
  volume: (loud: boolean) => void;
}) {
  const [speaker, setSpeaker] = useState(false),
    [muted, setMuted] = useState(false),
    [keypad, setKeypad] = useState(false),
    [digits, setDigits] = useState("");
  return (
    <section
      className="phone-outgoing"
      role="dialog"
      aria-modal="true"
      aria-label={`正在呼叫${name}`}
    >
      <div className="phone-call-person">
        <span className="phone-letter-avatar">{firstContactGlyph(name)}</span>
        <h1>{name}</h1>
        <p>正在呼叫...</p>
      </div>
      {audioBlocked && (
        <button className="phone-audio-retry" onClick={retry}>
          点击播放回铃声
        </button>
      )}
      {keypad && (
        <div className="phone-call-keypad">
          <output>{digits || "拨号键盘"}</output>
          <div>
            {Array.from("123456789*0#").map((d) => (
              <button key={d} onClick={() => setDigits((v) => v + d)}>
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="phone-call-actions">
        <button
          aria-pressed={speaker}
          onClick={() => {
            setSpeaker(!speaker);
            volume(!speaker);
          }}
        >
          <span>
            <Volume2 />
          </span>
          扬声器
        </button>
        <button disabled>
          <span>
            <Video />
          </span>
          FaceTime
        </button>
        <button aria-pressed={muted} onClick={() => setMuted(!muted)}>
          <span>
            <MicOff />
          </span>
          静音
        </button>
        <button disabled>
          <span>
            <Plus />
          </span>
          添加通话
        </button>
        <button className="phone-end" aria-label="挂断电话" onClick={end}>
          <span>
            <Phone />
          </span>
          结束
        </button>
        <button aria-pressed={keypad} onClick={() => setKeypad(!keypad)}>
          <span>
            <Grid3X3 />
          </span>
          拨号键盘
        </button>
      </div>
    </section>
  );
}

export function StoryPhoneApp({ contacts }: { contacts: Item[] }) {
  const calls = useContext(PhoneCallContext);
  const [tab, setTab] = useState("最近通话"),
    [query, setQuery] = useState(""),
    [digits, setDigits] = useState("");
  const list = contacts.filter(
    (i) => i.folder === "通讯录" && i.title.includes(query),
  );
  return (
    <div className="catalog-skin story-phone-app">
      <header className="app-nav">
        <strong>电话</strong>
      </header>
      <div className="story-phone-scroll">
        {tab !== "拨号键盘" && <h1>{tab}</h1>}
        {tab === "拨号键盘" ? (
          <div className="story-phone-dialpad">
            <output>{digits}</output>
            <div>
              {Array.from("123456789*0#").map((d) => (
                <button key={d} onClick={() => setDigits((v) => v + d)}>
                  <span>{d}</span><small>{({"2":"ABC","3":"DEF","4":"GHI","5":"JKL","6":"MNO","7":"PQRS","8":"TUV","9":"WXYZ","0":"+"} as Record<string,string>)[d] || " "}</small>
                </button>
              ))}
            </div>
            <button
              className="phone-dial-green"
              disabled={!digits}
              aria-label="拨打电话"
              onClick={() => calls?.dial(digits)}
            >
              <Phone />
            </button>
            <button className="phone-dial-delete" onClick={() => setDigits((v) => v.slice(0, -1))}>
              删除
            </button>
          </div>
        ) : (
          <>
            <label className="story-phone-search">
              <Search size={18} />
              <input
                aria-label="搜索电话联系人"
                placeholder="搜索"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            {tab === "通讯录" ? (
              <div className="story-phone-contacts">
                {list.map((i) => (
                  <button key={i.id} onClick={() => calls?.dial(i.title)}>
                    <span className="phone-letter-avatar">
                      {firstContactGlyph(i.title)}
                    </span>
                    <strong>{i.title}</strong>
                    <Phone size={18} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="story-phone-recents">
                {calls?.records
                  .filter((r) => r.name.includes(query))
                  .map((r) => (
                    <button key={r.id} onClick={() => calls.dial(r.name)}>
                      <span className="phone-letter-avatar">
                        {firstContactGlyph(r.name)}
                      </span>
                      <span>
                        <strong>{r.name}</strong>
                        <small>拨出 · {r.status}</small>
                      </span>
                      <time>{r.time}</time>
                    </button>
                  ))}
                {!calls?.records.length && (
                  <p className="phone-no-calls">暂无通话记录</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <nav className="catalog-tabs">
        {[
          { name: "最近通话", icon: Clock },
          { name: "通讯录", icon: Users },
          { name: "拨号键盘", icon: Grid3X3 },
        ].map((t) => (
          <button
            key={t.name}
            className={tab === t.name ? "selected" : ""}
            onClick={() => {
              setQuery("");
              setTab(t.name);
            }}
          >
            <t.icon />
            <span>{t.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
