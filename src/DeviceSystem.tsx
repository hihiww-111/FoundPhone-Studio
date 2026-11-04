import { pinyinCandidates } from "./pinyinInput";
import { SystemNotifications } from "./SystemNotifications";
import {
  ConnectivityModule,
  SliderModule,
} from "./vendor/ios-web/ControlModules";
import { UnlockHandle } from "./vendor/ios-web/UnlockHandle";
import { useState, useEffect, useRef, createContext, useContext } from "react";
import {
  LockKeyhole,
  Flashlight,
  Camera,
  Delete,
  ChevronDown,
  Play,
  SkipForward,
  Moon,
  RotateCcw,
  Monitor,
  Timer,
  Calculator,
  Globe,
  Mic,
  ArrowUp,
  ChevronUp,
  Plus,
  Power,
  Signal,
  House,
  ScanLine,
  Circle,
  Radio,
  Wifi,
  Battery,
  Heart,
  Music2,
  Airplay,
  ChevronRight,
  Lock,
} from "lucide-react";
import { motion } from "motion/react";
import type { Work } from "./schema";
export const KeyboardContext = createContext<(open: boolean) => void>(() => {});
export type FreeKeyboardBinding = { text: string; change: (text: string) => void; send: (text: string) => void };
export const FreeKeyboardContext = createContext<(binding: FreeKeyboardBinding | null) => void>(() => {});
export const ScriptKeyboardContext = createContext<(draft: string | null) => void>(() => {});
export function NativeComposer({
  creator,
  onAdd,
}: {
  creator: boolean;
  onAdd: () => void;
}) {
  const open = useContext(KeyboardContext);
  return (
    <button
      className="native-compose-field"
      aria-label={creator ? "添加消息" : "输入消息"}
      onClick={() => (creator ? onAdd() : open(true))}
    >
      {creator ? "添加消息" : ""}
    </button>
  );
}
export function DeviceLock({
  work,
  time,
  notices,
  onDismiss,
  pinOpen,
  setPinOpen,
  error,
  onUnlock,
  onCamera,
  onLight,
}: {
  work: Work;
  time: string;
  notices: string[];
  onDismiss: (index: number) => void;
  pinOpen: boolean;
  setPinOpen: (v: boolean) => void;
  error: string;
  onUnlock: (v: string) => void;
  onCamera: () => void;
  onLight: () => void;
}) {
  const birthday = work.data.settings?.find(item => item.id === "lock-left-birthday");
  const [code, setCode] = useState("");
  useEffect(() => {
    if (error) setCode("");
  }, [error]);
  useEffect(() => {
    if (!pinOpen) setCode("");
  }, [pinOpen]);
  const digit = (key: string) => {
    const value = key === "⌫" ? code.slice(0, -1) : (code + key).slice(0, 12);
    setCode(value);
    if (
      /^\d+$/.test(work.phone.passcode) &&
      value.length === work.phone.passcode.length
    ) {
      onUnlock(value);
      setCode("");
    }
  };
  const open = () => (work.phone.passcode ? setPinOpen(true) : onUnlock(""));
  return (
    <motion.div
      className={"lock-screen device-lock " + (pinOpen ? "pin-open" : "")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ y: -852, opacity: 0 }}
      transition={{ duration: 0.48, ease: [0.32, 0.72, 0, 1] }}
    >
      {!pinOpen ? (
        <>
          <div className="lock-clock-block">
            <LockKeyhole size={18} />
            <p>
              {new Intl.DateTimeFormat("zh-CN", {
                month: "long",
                day: "numeric",
                weekday: "long",
                timeZone: "UTC",
              }).format(
                new Date((work.phone.date || "2026-09-01") + "T12:00:00Z"),
              )}
            </p>
            <h1>{time}</h1>
          </div>
          <div className="lock-notifications">
            {birthday && <div className="lock-birthday-notice" role="note" aria-label="生日提醒">
              <div><strong>{birthday.title}</strong><p>{birthday.body}</p></div>
              <small>现在</small>
            </div>}
            {work.phone.notifications && (
              <SystemNotifications
                compact
                notices={notices}
                apps={work.apps}
                onOpen={open}
                onDismiss={onDismiss}
              />
            )}
          </div>
          <UnlockHandle onUnlock={open} />

          <div className="lock-tools">
            <button onClick={onLight} aria-label="手电筒">
              <Flashlight size={23} />
            </button>
            <button
              onClick={onCamera}
              disabled={
                !work.apps.some((a) => a.installed && a.id === "camera")
              }
              aria-label="相机"
            >
              <Camera size={25} />
            </button>
          </div>
        </>
      ) : (
        <div className="device-passcode">
          <LockKeyhole size={22} />
          <h2>输入密码</h2>
          <div
            className={"passcode-dots " + (error ? "pin-shake" : "")}
            aria-label={"已输入" + code.length + "位密码"}
          >
            {Array.from({ length: work.phone.passcode.length }, (_, i) => (
              <i key={i} className={i < code.length ? "filled" : ""} />
            ))}
          </div>
          <input
            className={
              /^\d+$/.test(work.phone.passcode)
                ? "accessible-pin"
                : "legacy-passcode"
            }
            aria-label="锁屏密码"
            autoComplete="off"
            inputMode="numeric"
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onUnlock(code)}
          />
          <div className="pin-keypad">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""].map(
              (n, i) =>
                n ? (
                  <button
                    key={i}
                    aria-label={"密码键" + n}
                    onClick={() => digit(n)}
                  >
                    <b>{n}</b>
                    <small>
                      {
                        [
                          "",
                          "",
                          "ABC",
                          "DEF",
                          "GHI",
                          "JKL",
                          "MNO",
                          "PQRS",
                          "TUV",
                          "WXYZ",
                        ][Number(n)]
                      }
                    </small>
                  </button>
                ) : (
                  <span key={i} />
                ),
            )}
          </div>
          <span role="status" className="pin-error">
            {error}
          </span>
          {!/^[0-9]+$/.test(work.phone.passcode) && (
            <button onClick={() => onUnlock(code)}>解锁</button>
          )}
          <div className="pin-footer">
            <button onClick={() => setPinOpen(false)}>取消</button>
            <button
              aria-label="删除一位密码"
              onClick={() => (code ? digit("⌫") : setPinOpen(false))}
            >
              {code ? "删除" : "取消"}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
export function ControlCenter({
  battery = 94,
  network,
  close,
}: {
  battery?: number;
  network: string;
  close: () => void;
}) {
  const [rotation, setRotation] = useState(true),
    [focus, setFocus] = useState(false),
    [playing, setPlaying] = useState(false);
  const [brightness, setBrightness] = useState(50),
    [volume, setVolume] = useState(25);
  const [tool, setTool] = useState("");
  return (
    <motion.div
      className="system-panel device-control"
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
    >
      <button className="cc-close" aria-label="关闭控制中心" onClick={close}>
        <Power />
      </button>
      <button
        className="cc-edit"
        aria-label="控制中心编辑"
        onClick={() => setTool("编辑控制")}
      >
        <Plus />
      </button>
      <div className="cc-current">
        <span>
          <Airplay size={13} />
        </span>
        控制中心 <ChevronRight size={16} />
      </div>
      <div className="cc-status" aria-label={"蜂窝网络 " + network}>
        <div>
          <span>
            <Signal size={18} />
            <small>主号</small> 中国移动 <Wifi size={17} />
          </span>
          <span>
            <Signal size={18} />
            <small>副号</small> 中国电信
          </span>
        </div>
        <span>
          <Lock size={13} /> {battery}% <Battery size={27} />
        </span>
      </div>
      <nav className="cc-page-rail" aria-label="控制中心分类">
        {[Heart, Music2, House, Radio].map((Icon, i) => (
          <button
            key={i}
            aria-label={["常用控制", "媒体控制", "家庭控制", "连接控制"][i]}
            onClick={() =>
              document
                .querySelector(
                  [".cc-grid", ".cc-music", ".cc-home", ".cc-connect"][i],
                )
                ?.scrollIntoView({ block: "nearest", behavior: "smooth" })
            }
          >
            <Icon fill={i === 0 ? "currentColor" : "none"} />
          </button>
        ))}
      </nav>
      <div className="cc-grid">
        <ConnectivityModule />
        <div className="cc-music">
          <div className="cc-media-top">
            <span>
              <Music2 size={28} />
            </span>
            <Airplay size={21} />
          </div>
          <div className="cc-media-title">
            <strong>{playing ? "测试播放" : "未在播放"}</strong>
            <small>音乐</small>
          </div>
          <div>
            <button aria-label="上一首">
              <SkipForward style={{ transform: "rotate(180deg)" }} />
            </button>
            <button
              aria-label={playing ? "暂停" : "播放"}
              onClick={() => setPlaying(!playing)}
            >
              <Play fill="currentColor" />
            </button>
            <button aria-label="下一首">
              <SkipForward />
            </button>
          </div>
        </div>
        <button
          className={"cc-square " + (rotation ? "cc-white" : "")}
          aria-label="旋转锁定"
          aria-pressed={rotation}
          onClick={() => setRotation(!rotation)}
        >
          <span className="cc-rotation">
            <RotateCcw />
            <Lock size={14} />
          </span>
        </button>
        <button
          className="cc-square"
          onClick={() => setTool(tool ? "" : "屏幕镜像")}
          aria-label="屏幕镜像"
        >
          <Monitor />
        </button>
        <SliderModule
          type="brightness"
          value={brightness}
          onChange={setBrightness}
        />
        <SliderModule type="volume" value={volume} onChange={setVolume} />
        <button
          className={"cc-focus " + (focus ? "cc-white" : "")}
          aria-pressed={focus}
          onClick={() => setFocus(!focus)}
        >
          <Moon />
          <span>专注模式</span>
          <ChevronDown size={14} />
        </button>
        <button className="cc-home" onClick={() => setTool("家庭")}>
          <House size={38} />
          <span>未设置家庭</span>
        </button>
        {[Flashlight, Timer, Calculator, Camera].map((Icon, i) => (
          <button
            className={"cc-square cc-tool-" + i}
            aria-label={["手电筒", "计时器", "计算器", "相机"][i]}
            key={i}
            onClick={() =>
              setTool(tool ? "" : ["手电筒", "计时器", "计算器", "相机"][i])
            }
          >
            <Icon />
          </button>
        ))}
        {[ScanLine, Circle, Radio].map((Icon, i) => (
          <button
            key={i}
            className={"cc-square cc-bottom-tool cc-bottom-" + i}
            aria-label={["扫码", "屏幕录制", "声音识别"][i]}
            onClick={() => setTool(["扫码", "屏幕录制", "声音识别"][i])}
          >
            <Icon />
          </button>
        ))}
      </div>
      {tool && (
        <div className="cc-tool">
          <strong>{tool}</strong>
          <p>
            {tool === "屏幕镜像" ? "正在搜索作品中的设备…" : "作品内快捷控制"}
          </p>
          <button onClick={() => setTool("")}>完成</button>
        </div>
      )}
      <button className="cc-dismiss" onClick={close}>
        轻扫以关闭
        <ChevronUp size={16} />
      </button>
    </motion.div>
  );
}
export function DeviceKeyboard({ close, scriptedText, binding }: { close: () => void; scriptedText?: string; binding?: FreeKeyboardBinding | null }) {
  const [localValue, setLocalValue] = useState("");
  const [shift, setShift] = useState(false), [numbers, setNumbers] = useState(false);
  const [chinese, setChinese] = useState(true), [composition, setComposition] = useState("");
  const [dictionary, setDictionary] = useState<Record<string, string[]>>({});
  const [candidatePage, setCandidatePage] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const value = binding?.text ?? localValue;
  const setValue = binding?.change ?? setLocalValue;
  useEffect(() => {
    if (binding) void import("./vendor/pinyin/dictionary.json").then(data => setDictionary(data.default)).catch(() => setDictionary({}));
  }, [!!binding]);
  const candidates = pinyinCandidates(dictionary, composition);
  const insert = (text: string) => {
    const start = input.current?.selectionStart ?? value.length;
    const end = input.current?.selectionEnd ?? start;
    setValue(value.slice(0, start) + text + value.slice(end));
    requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(start + text.length, start + text.length); });
  };
  const choose = (word: string, consumed: number) => { insert(word); setComposition(composition.slice(consumed)); setCandidatePage(0); };
  const type = (letter: string) => {
    if (scriptedText !== undefined) return;
    if (binding && chinese && !numbers && !shift && /^[a-z]$/.test(letter)) { setComposition(composition + letter); setCandidatePage(0); }
    else insert(shift ? letter.toUpperCase() : letter);
  };
  const erase = () => {
    if (scriptedText !== undefined) return;
    if (composition) { setComposition(composition.slice(0, -1)); setCandidatePage(0); return; }
    const start = input.current?.selectionStart ?? value.length, end = input.current?.selectionEnd ?? start;
    if (start !== end) { insert(""); return; }
    const prefix = Array.from(value.slice(0, start)); prefix.pop();
    const position = prefix.join("").length;
    setValue(prefix.join("") + value.slice(end));
    requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(position, position); });
  };
  const finish = () => {
    if (!binding) { close(); return; }
    const composed = composition ? candidates[0] ? candidates[0].word + composition.slice(candidates[0].consumed) : composition : "";
    const start = input.current?.selectionStart ?? value.length, end = input.current?.selectionEnd ?? start;
    const text = value.slice(0, start) + composed + value.slice(end);
    if (!text.trim()) return;
    binding.send(text); setComposition("");
  };
  return (
    <div onPointerDown={e => { if ((e.target as HTMLElement).closest("button")) e.preventDefault(); }} className="device-keyboard" data-scripted={scriptedText !== undefined} role="dialog" aria-label="屏幕键盘">
      <div className="keyboard-draft">
        <input
          ref={input}
          inputMode={binding ? "none" : undefined}
          autoFocus={scriptedText === undefined}
          readOnly={scriptedText !== undefined}
          aria-label="消息草稿"
          value={scriptedText ?? value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="输入消息"
        />
        <button aria-label="收起键盘" onClick={close}>
          <ChevronDown />
        </button>
      </div>
      <div className="keyboard-candidates" style={{ overflowX: "auto" }}>
        {binding ? <><span>{composition}</span>{candidates.slice(candidatePage * 6, candidatePage * 6 + 6).map((candidate, i) => <button key={i} onClick={() => choose(candidate.word, candidate.consumed)}>{candidate.word}</button>)}{candidates.length > 6 && <button aria-label="更多候选字" onClick={() => setCandidatePage((candidatePage + 1) % Math.ceil(candidates.length / 6))}>›</button>}</> :
          ["我", "你", "好的"].map(v => <button key={v} disabled={scriptedText !== undefined} onClick={() => insert(v)}>{v}</button>)}
      </div>
      {(numbers
        ? ["1234567890", "-/:;()¥&@", ".,?!'"]
        : ["qwertyuiop", "asdfghjkl", "zxcvbnm"]
      ).map((row, i) => (
        <div className="keyboard-row" key={i}>
          {i === 2 && (
            <button
              className="key-special"
              aria-label="切换大小写"
              onClick={() => setShift(!shift)}
            >
              <ArrowUp size={19} />
            </button>
          )}
          {[...row].map((k) => (
            <button
              key={k}
              onClick={() => type(k)}
            >
              {shift ? k.toUpperCase() : k}
            </button>
          ))}
          {i === 2 && (
            <button
              className="key-special"
              aria-label="退格"
              onClick={erase}
            >
              <Delete size={20} />
            </button>
          )}
        </div>
      ))}
      <div className="keyboard-row keyboard-bottom">
        <button onClick={() => setNumbers(!numbers)}>
          {numbers ? "ABC" : "123"}
        </button>
        <button className="key-space" onClick={() => { if (composition && candidates[0]) choose(candidates[0].word, candidates[0].consumed); else { insert(composition || " "); setComposition(""); } }}>
          空格
        </button>
        <button onClick={finish}>{binding ? "发送" : "完成"}</button>
      </div>
      <div className="keyboard-accessories">
        <button aria-label="切换中文英文" onClick={() => { if (composition) insert(composition); setComposition(""); setChinese(!chinese); }}><Globe size={24} /></button>
        <small>{binding ? chinese ? "中文拼音" : "English" : "草稿"}</small>
        <Mic size={23} />
      </div>
    </div>
  );
}
export { NativeSettings } from "./ios/Settings";
