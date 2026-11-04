import { ForegroundClock, foregroundTimeout } from "./foregroundTime";
import { usesNativeKeyboard } from "./nativeKeyboard";
import { readVisitSave, writeVisitSave } from "./visitSave";
import { stampMessageArrivals, messageArrivalTime } from "./messageArrival";
import { lockedNotePreview } from "./notePreview";
import { readWechatThread } from "./wechatRead";
import { hiddenAlbumUnlocked, storyWallpaper } from "./storyPresentation";
import { allChatsFree, sendFreeReply } from "./freeReply";
import { collectLeftMessage, submittedLeftMessage } from "./leftMessageCollection";
import { PhoneCallContext, StoryPhoneApp, usePhoneCalls } from "./StoryPhone";
import { phoneIsUnlocked, resumePhoneStory } from "./phoneCalls";
import { MessageBanner, useStoryRoute, type StoryRoute } from "./Interlude";
import { photoSequence } from "./ios/photoNavigation";
import { AppHomeButton } from "./ios/AppHomeButton";
import { MusicPlaybackProvider, useMusicPlayback } from "./MusicPlayback";
import { StatusGlyph } from "./ios/StatusGlyph";
import { SocialDetail, socialDetailApps } from "./skins/SocialDetails";
import { NativeCalculator } from "./ios/Calculator";
import { WeatherApp } from "./ios/WeatherApp";
import { BeijingClockApp } from "./ios/BeijingClockApp";
import { HomeLauncher } from "./launcher/HomeLauncher";
import { useDeviceLayout } from "./launcher/layout";
import "./launcher/launcher.css";
import { NativeDetail, nativeDetailApps } from "./ios/Details";
import "./ios/details.css";
import {
  SystemNotifications,
  notificationContent,
} from "./SystemNotifications";
import {
  readLauncherOrigin,
  AppWindow,
  screenOrigin,
} from "./vendor/ios-web/Launcher";
import {
  DeviceLock,
  ControlCenter,
  DeviceKeyboard,
  KeyboardContext,
  ScriptKeyboardContext,
  FreeKeyboardContext,
  type FreeKeyboardBinding,
  NativeSettings,
} from "./DeviceSystem";
import { AppArtwork, hasNativeArtwork } from "./AppArtwork";
import { getFields } from "./fields";
import { catalogSkins } from "./skins/catalog";
import "./skins/skins.css";
import "./ios18.css";
import "./device-system.css";
import "./ios/tokens.css";
import "./ios/reference.css";
import "./ios/status-bar.css";
import { WeChatSkin, WhatsAppSkin } from "./AppSkins";
import { RichText } from "./RichText";
import {
  useEffect,
  useState,
  useRef,
  Suspense,
  type CSSProperties,
} from "react";
import { AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  Plus,
  Search,
  LockKeyhole,
  Heart,
  MessageCircle,
  MoreHorizontal,
  ArrowUp,
  Folder,
  Phone as PhoneIcon,
} from "lucide-react";
import { getApp, type AppPlugin } from "./registry";
import {
  initialRuntime,
  safeMedia,
  type Work,
  type Item,
  type Runtime,
  type UiValue,
} from "./schema";
import { dispatch, choose, visible, advance } from "./engine";
import { db } from "./persistence";
export function AppIcon({
  id,
  name,
  small = false,
  custom = "",
  date,
  time,
}: {
  id: string;
  name?: string;
  small?: boolean;
  custom?: string;
  date?: string;
  time?: string;
}) {
  const a = getApp(id);
  const Icon = a.icon;
  return (
    <span className={`app-icon-wrap ${small ? "small" : ""}`}>
      <span className="app-icon" style={{ background: a.color }}>
        {custom ? (
          safeMedia(custom) ? (
            <img decoding="async" src={safeMedia(custom)} alt="自定义图标" />
          ) : (
            <span>{custom.slice(0, 2)}</span>
          )
        ) : hasNativeArtwork(id) ? (
          <AppArtwork id={id} date={date} time={time} />
        ) : (
          <Icon size={small ? 21 : 28} strokeWidth={1.65} />
        )}
      </span>
      {name && <span className="app-name">{name}</span>}
    </span>
  );
}
type PhoneProps = Omit<Parameters<typeof PhoneRuntime>[0], "deviceLayout">;
export function Phone(props: PhoneProps) {
  const deviceLayout = useDeviceLayout(props.work, props.creator);
  return (
    <MusicPlaybackProvider key={props.work.id}>
      <PhoneRuntime
        {...props}
        work={deviceLayout.work}
        deviceLayout={deviceLayout}
      />
    </MusicPlaybackProvider>
  );
}
function PhoneRuntime({
  deviceLayout,
  work,
  creator = false,
  onEdit,
  onAdd,
  onSettings,
  onOpen,
  runtime: external,
  onRuntime,
}: {
  deviceLayout: ReturnType<typeof useDeviceLayout>;
  work: Work;
  creator?: boolean;
  onEdit?: (app: string, item: Item) => void;
  onAdd?: (app: string) => void;
  onSettings?: () => void;
  onOpen?: (app: string) => void;
  runtime?: Runtime;
  onRuntime?: (s: Runtime) => void;
}) {
  const musicPlayback = useMusicPlayback();
  const quietMusicForVideo = (event: { target: EventTarget }) => {
    const media = event.target as HTMLMediaElement;
    if (media.tagName === "VIDEO" && !media.muted && !media.paused) musicPlayback.pause();
  };
  const [app, setApp] = useState("");
  const [homeRequest, setHomeRequest] = useState(0);
  const [locked, setLocked] = useState(!creator);
  const [pinOpen, setPinOpen] = useState(false);
  const [quickCamera, setQuickCamera] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [freeKeyboard, setFreeKeyboard] = useState<FreeKeyboardBinding | null>(null);
  const [scriptDraft, setScriptDraft] = useState<string | null>(null);
  const [storyRoute, setStoryRoute] = useState<StoryRoute>();
  const [activeChat, setActiveChat] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const appSnapshots = useRef(new Map<string, HTMLElement>());
  const [banner, setBanner] = useState("");
  const noticesSeen = useRef(0);
  const [contextApp, setContextApp] = useState("");
  const [deviceScale, setDeviceScale] = useState(0.84);
  const shell = useRef<HTMLDivElement>(null);
  const gesture = useRef({ x: 0, y: 0, time: 0, zone: "" });
  const [launchOrigin, setLaunchOrigin] = useState(screenOrigin);

  const beginUnlock = () => {
    setPinError("");
    setQuickCamera(false);
    if (work.phone.passcode) setPinOpen(true);
    else unlock();
  };
  const pressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const gestureConsumed = useRef(false);
  const [pinError, setPinError] = useState("");
  const [folder, setFolder] = useState("");
  const [panel, setPanel] = useState("");
  const [own, setOwn] = useState(() => initialRuntime(work));
  const [ready, setReady] = useState(creator || !!external);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    const el = shell.current;
    if (!el) return;
    const fit = () => {
      const viewport = window.visualViewport;
      const mobile = !creator && !external && usesNativeKeyboard(navigator);
      const stage = mobile ? el.closest<HTMLElement>(".story-runtime") : null;
      if (stage && viewport) {
        stage.style.height = `${viewport.height}px`;
        stage.style.top = `${viewport.offsetTop}px`;
      }
      const height = mobile && viewport ? viewport.height : window.innerHeight;
      setDeviceScale(
        Math.max(
          mobile ? 0.2 : 0.4,
          Math.min(
            1,
            (el.parentElement!.clientWidth - 24) / 407,
            (height - (creator ? 170 : external ? 150 : 40)) / 866,
          ),
        ),
      );
    };
    const observer = new ResizeObserver(fit);
    observer.observe(el.parentElement!);
    window.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("scroll", fit);
    fit();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("scroll", fit);
      const stage = el.closest<HTMLElement>(".story-runtime");
      stage?.style.removeProperty("height");
      stage?.style.removeProperty("top");
    };
  }, [creator, ready]);
  const s = external ?? own;
  const runtimeRef = useRef(s);
  runtimeRef.current = s;
  const storyClock = useRef(new ForegroundClock(performance.now(), !document.hidden));
  const update = (next: Runtime) => {
    next = stampMessageArrivals(work, next);
    runtimeRef.current = next;
    setOwn(next);
    onRuntime?.(next);
  };
  const currentRuntime = () => {
    const now = performance.now();
    const next = advance(work, runtimeRef.current, storyClock.current.consume(now));
    runtimeRef.current = next;
    return next;
  };
  const phoneCalls = usePhoneCalls(work, s, runtimeRef, update, currentRuntime);
  useEffect(() => {
    let active = true;
    if (creator || external) return;
    void Promise.resolve().then(() => {
      if (work.id !== "phone-a-story") return db.saves.get(work.id);
      const navigation = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type ?? "navigate";
      return readVisitSave(work.id, navigation, sessionStorage);
    }).then((saved) => {
        if (!active) return;
        if (saved && resumePhoneStory(work, saved.state))
          setOwn(resumePhoneStory(work, saved.state)!);
        else {
          setOwn(dispatch(work, initialRuntime(work), "start"));
          if (saved) setLoadError("作品已更新，已开始新的进度。");
        }
        setReady(true);
      })
      .catch(() => {
        setOwn(dispatch(work, initialRuntime(work), "start"));
        setLoadError("无法读取本地存档。本次仍可游玩。");
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, [work.id, work.updatedAt, creator, external]);
  useEffect(() => {
    if (!creator && !external && ready)
      void Promise.resolve().then(() => {
        if (work.id === "phone-a-story") writeVisitSave(work.id, own, sessionStorage);
        else return db.saves.put({ id: work.id, state: own });
      }).catch(() => setLoadError("存档失败，请检查浏览器存储权限。"));
  }, [own, creator, work.id, external, ready]);
  useEffect(() => {
    if (creator || !ready) return;
    storyClock.current = new ForegroundClock(performance.now(), !document.hidden);
    const visibility = () => {
      const elapsed = storyClock.current.visibility(!document.hidden, performance.now());
      const next = advance(work, runtimeRef.current, elapsed);
      update(next);
      if (work.id === "phone-a-story" && !external) {
        try { writeVisitSave(work.id, runtimeRef.current, sessionStorage); } catch { /* Normal save reports storage errors. */ }
      }
    };
    const pagehide = () => {
      const next = advance(work, runtimeRef.current, storyClock.current.visibility(false, performance.now()));
      update(next);
      if (work.id === "phone-a-story" && !external) {
        try { writeVisitSave(work.id, runtimeRef.current, sessionStorage); } catch { /* Best-effort lifecycle flush. */ }
      }
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pagehide);
    window.addEventListener("pageshow", visibility);
    const interval = setInterval(() => {
      // Hidden time never contributes to pending story delays.
      if (document.hidden) return;
      const previous = runtimeRef.current;
      const next = currentRuntime();
      const changed =
        next.time !== previous.time ||
        next.trace.join() !== previous.trace.join() ||
        (next.scheduled?.length ?? 0) !== (previous.scheduled?.length ?? 0) ||
        (next.scheduled?.length ?? 0) > 0 ||
        Math.floor((next.elapsedMs ?? 0) / 5000) !==
          Math.floor((previous.elapsedMs ?? 0) / 5000);
      if (changed) update(next);
    }, 250);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pagehide);
      window.removeEventListener("pageshow", visibility);
    };
  }, [creator, ready, work.id, work.updatedAt]);
  const event = (event: string, target: string) => {
    if (!creator) update(dispatch(work, currentRuntime(), event, target));
  };
  const captureApp = () => {
    if (!app) return;
    const current = shell.current?.querySelector<HTMLElement>(".app-screen");
    if (!current) return;
    const snapshot = current.cloneNode(true) as HTMLElement;
    snapshot.style.transform = "none";
    snapshot.style.opacity = "1";
    snapshot.style.filter = "none";
    snapshot.style.borderRadius = "0";
    snapshot.querySelectorAll("audio").forEach((el) => el.remove());
    snapshot.querySelectorAll("video").forEach((el) => {
      el.removeAttribute("autoplay");
      el.removeAttribute("src");
    });
    snapshot.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    appSnapshots.current.set(app, snapshot);
    for (const id of appSnapshots.current.keys())
      if (!recent.includes(id) && id !== app) appSnapshots.current.delete(id);
  };
  const returnHome = () => {
    captureApp();
    setHomeRequest((n) => n + 1);
    setKeyboard(false);
    setQuickCamera(false);
    setApp("");
    setFolder("");
    setPanel("");
  };
  const restricted = !creator && work.id === "phone-a-story";
  const open = (id: string) => {
    if (restricted && id === "appstore") return;
    if (!creator && id === "phone" && runtimeRef.current.variables.interludeEnabled && !phoneIsUnlocked(runtimeRef.current)) return;
    if (!work.apps.some((a) => a.id === id && a.installed)) return;
    setStoryRoute(undefined);
    setActiveChat("");
    if (id === "instagram" && work.id === "phone-a-story") {
      const current = runtimeRef.current;
      update({...current,ui:{...current.ui,instagram:{...current.ui?.instagram,mymyTab:"个人主页"}}});
    }
    setApp(id);
    setKeyboard(false);
    setRecent((v) => [id, ...v.filter((a) => a !== id)].slice(0, 8));
    setFolder("");
    setPanel("");
    onOpen?.(id);
    event("openApp", id);
  };
  useEffect(() => {
    if (creator || !ready) return;
    const current = currentRuntime();
    const stamped = stampMessageArrivals(work, current);
    if (stamped !== current) update(stamped);
  }, [creator, ready, s.unlocked]);
  const storyUnread = [...(work.data.wechat ?? []), ...(s.messages.wechat ?? [])].filter(i => (i.meta.interlude === "true" || (s.messages.wechat ?? []).some(message => message.id === i.id)) && !["朋友圈", "我"].includes(i.folder) && i.kind !== "post" && !i.outgoing && !i.read && visible(i,s) && !s.read.includes(i.id)).sort((a,b) => s.unlocked.indexOf(a.id) - s.unlocked.indexOf(b.id));
  const unreadThreadKey = storyUnread.map(item => item.id).join("|");
  useEffect(() => {
    if (creator || app !== "wechat" || !activeChat) return;
    const current = currentRuntime();
    const next = readWechatThread(work, current, activeChat);
    if (next !== current) update(next);
  }, [creator, app, activeChat, unreadThreadKey]);

  useEffect(() => {
    if (creator) return;
    if (s.variables.meetReady && !s.variables.meetAccepted) { setKeyboard(false); setScriptDraft(null); }
    if (s.variables.finalNoteReady && !s.read.includes("interlude-happy-note")) {
      setKeyboard(false); setScriptDraft(null); setApp("notes"); setFolder(""); setPanel("");
      setStoryRoute({serial:Date.now(),app:"notes",note:"interlude-happy-note"});
    }
  }, [creator, s.variables.meetReady, s.variables.meetAccepted, s.variables.finalNoteReady, s.read]);
  const installedApps = work.apps.filter((a) => a.installed);
  const apps = installedApps.filter((a) => a.visible);
  const unlock = (pin = "") => {
    if (!work.phone.passcode || pin === work.phone.passcode) {
      setLocked(false);
      setPinOpen(false);
      event("password", pin);
    } else {
      setPinError("密码不正确");
      setPinOpen(true);
    }
  };
  useEffect(() => {
    if (app && !work.apps.some((a) => a.id === app && a.installed)) setApp("");
  }, [app, work.apps]);
  const [wallClock, setWallClock] = useState(() => new Date());
  useEffect(() => {
    if (creator) return;
    const tick = () => {
      if (document.hidden) return;
      const now = new Date();
      setWallClock(previous =>
        Math.floor(previous.getTime() / 60000) === Math.floor(now.getTime() / 60000)
          ? previous : now);
    };
    tick();
    const timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [creator]);
  const displayTime = creator
    ? work.phone.time
    : wallClock.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  const displayDate = creator
    ? work.phone.date
    : `${wallClock.getFullYear()}-${String(wallClock.getMonth() + 1).padStart(2, "0")}-${String(wallClock.getDate()).padStart(2, "0")}`;
  const plugin = getApp(app);
  useEffect(() => {
    const count = s.notifications.length;
    if (!locked && work.phone.notifications && count > noticesSeen.current) {
      setBanner(s.notifications.at(-1) || "");
      const cancelTimer = foregroundTimeout(() => setBanner(""), 4500);
      noticesSeen.current = count;
      return cancelTimer;
    }
    noticesSeen.current = count;
  }, [s.notifications.length, locked, work.phone.notifications]);
  const dismissNotice = (index: number) =>
    update({
      ...runtimeRef.current,
      notifications: runtimeRef.current.notifications.filter(
        (_, i) => i !== index,
      ),
    });
  if (!ready) return <div className="phone-loading">正在恢复进度…</div>;
  return (
    <div
      ref={shell}
      style={{ "--phone-scale": deviceScale } as CSSProperties}
      className={`phone-shell ios18 ${work.phone.theme === "dark" ? "dark-phone" : ""}`}
    >
      <PhoneCallContext.Provider value={phoneCalls.context}>
      <KeyboardContext.Provider value={setKeyboard}>
      <ScriptKeyboardContext.Provider value={setScriptDraft}>
      <FreeKeyboardContext.Provider value={setFreeKeyboard}>
        <div
          className={`phone-screen wallpaper-${work.phone.wallpaper} ${locked ? "is-locked" : ""} ${app ? "in-app" : ""} ${keyboard ? "keyboard-open" : ""}`}
          style={{ background: `center / cover no-repeat url("${work.id === "phone-a-story" ? storyWallpaper(s, locked) : locked ? "/wallpapers/lock.jpg" : "/wallpapers/home.jpg"}")` }}
          data-app={app}
          onPlayCapture={quietMusicForVideo}
          onVolumeChangeCapture={quietMusicForVideo}
          onDragStart={(e) => e.preventDefault()}
          onPointerDown={(e) => {
            gestureConsumed.current = false;
            const button = (e.target as HTMLElement).closest<HTMLElement>(
              "[data-app-id]",
            );
            if (button) {
              pressTimer.current = setTimeout(() => {
                gestureConsumed.current = true;
                setContextApp(button.dataset.appId || "");
              }, 550);
            }
            const box = e.currentTarget.getBoundingClientRect(),
              x = (e.clientX - box.left) / deviceScale,
              y = (e.clientY - box.top) / deviceScale;
            gesture.current = {
              x,
              y,
              time: Date.now(),
              zone: y < 58 ? "top" : y > 818 ? "bottom" : locked ? "lock" : "",
            };
          }}
          onPointerMove={(e) => {
            if (Math.abs(e.movementX) > 5 || Math.abs(e.movementY) > 5)
              clearTimeout(pressTimer.current);
          }}
          onPointerCancel={() => clearTimeout(pressTimer.current)}
          onPointerUp={(e) => {
            clearTimeout(pressTimer.current);
            const box = e.currentTarget.getBoundingClientRect(),
              y = (e.clientY - box.top) / deviceScale,
              g = gesture.current;
            const dy = y - g.y;
            if (g.zone === "top" && dy > 65)
              setPanel(g.x > 230 ? "control" : "notification");
            else if ((g.zone === "bottom" || g.zone === "lock") && dy < -55 && (!restricted || locked)) {
              gestureConsumed.current = true;
              if (!locked) captureApp();
              setKeyboard(false);
              if (panel) {
                setPanel("");
              } else if (locked) {
                beginUnlock();
              } else if (g.zone === "bottom" && Date.now() - g.time > 450) {
                captureApp();
                setPanel("switcher");
              } else {
                setApp("");
                setPanel("");
                setFolder("");
              }
            }
          }}
          onClickCapture={(e) => {
            const target = (e.target as HTMLElement).closest(
              ".home-app-grid button,.dock button",
            );
            if (target) {
              setLaunchOrigin(
                readLauncherOrigin(target as HTMLElement, e.currentTarget),
              );
            }
          }}
        >
          <div className="wallpaper-orb orb-one" style={{ display: "none" }} />
          <div className="wallpaper-orb orb-two" style={{ display: "none" }} />
          <div className="status-bar">
            <button
              onClick={() =>
                setPanel(panel === "notification" ? "" : "notification")
              }
              className="status-time"
              aria-label="通知中心"
            >
              {displayTime}
              <StatusGlyph kind="silent" />
            </button>
            <div className="dynamic-island" />
            <button
              className="signals"
              onClick={() => setPanel(panel === "control" ? "" : "control")}
              aria-label="控制中心"
            >
              <StatusGlyph kind="cellular" />
              <StatusGlyph kind="wifi" />
              <span
                className={`ios-battery${work.phone.battery <= 20 ? " low-battery" : ""}`}
              >
                <span style={{ width: `${work.phone.battery}%` }} />
                <b>{work.phone.battery}</b>
              </span>
            </button>
          </div>
          <AnimatePresence mode="wait">
            {locked && !(quickCamera && app === "camera") ? (
              <DeviceLock
                work={
                  { ...work, phone: { ...work.phone, date: displayDate } }
                }
                time={displayTime}
                notices={s.notifications}
                onDismiss={dismissNotice}
                pinOpen={pinOpen}
                setPinOpen={setPinOpen}
                error={pinError}
                onUnlock={unlock}
                onLight={() => setPanel("light")}
                onCamera={() => {
                  setQuickCamera(true);
                  open("camera");
                }}
              />
            ) : app && app !== "appstore" ? (
              <AppWindow
                key={app}
                className={`app-screen engine-${plugin.engine} skin-${app}`}
                creator={creator}
                origin={launchOrigin}
              >
                <AppHomeButton onHome={returnHome} />
                <AppContent
                  route={storyRoute}
                  onThreadChange={setActiveChat}
                  onStoryDraft={(id) => event("draftComplete", id)}
                  onStorySend={(id) => event("send", id)}
                  onFreeSend={(text, thread) => {
                    const before = currentRuntime();
                    const next = sendFreeReply(work, before, text, thread);
                    update(next);
                    const sent = submittedLeftMessage(work, before, next, thread);
                    if (!creator && sent) collectLeftMessage(sent.id, sent.body);
                  }}
                  app={plugin}
                  name={
                    work.apps.find((a) => a.id === app)?.name ?? plugin.name
                  }
                  items={[
                    ...(work.data[app] ?? []),
                    ...(s.messages[app] ?? []),
                  ]}
                  creator={creator}
                  state={s}
                  onRead={(id) => event("read", id)}
                  onEdit={(item) => onEdit?.(app, item)}
                  onAdd={() => onAdd?.(app)}
                  onBack={() => setApp("")}
                  onSettings={onSettings}
                  onUi={(key, value) => {
                    const current = runtimeRef.current;
                    update(
                      dispatch(
                        work,
                        {
                          ...current,
                          ui: {
                            ...current.ui,
                            [app]: { ...current.ui?.[app], [key]: value },
                          },
                        },
                        "variable",
                        `ui:${app}:${key}`,
                      ),
                    );
                  }}
                  work={work}
                />
              </AppWindow>
            ) : (
              <HomeLauncher
                key={
                  "home-" + homeRequest + (app === "appstore" ? "store" : "")
                }
                blockedApps={!creator && s.variables.interludeEnabled && !phoneIsUnlocked(s) ? ["phone"] : []}
                restricted={restricted}
                storeOpen={!restricted && app === "appstore"}
                closeStore={returnHome}
                work={work}
                layout={deviceLayout.layout}
                change={deviceLayout.change}
                importLayout={deviceLayout.importLayout}
                error={deviceLayout.error}
                open={open}
                onFolder={setFolder}
                search={() => { if (!restricted) setPanel("search"); }}
                time={displayTime}
                icon={(a, small) => (
                  <span className="story-icon-wrap"><AppIcon
                    key={a.id}
                    id={a.id}
                    name={small ? undefined : a.name}
                    small={small}
                    custom={a.icon}
                    date={displayDate}
                    time={displayTime}
                  />{a.id === "wechat" && storyUnread.length > 0 && <b className="story-app-badge">{storyUnread.length}</b>}</span>
                )}
                clearApp={(id) =>
                  update({
                    ...runtimeRef.current,
                    messages: Object.fromEntries(
                      Object.entries(runtimeRef.current.messages).filter(
                        ([app]) => app !== id,
                      ),
                    ),
                  })
                }
              />
            )}
          </AnimatePresence>
          {folder && (
            <div className="folder-overlay" onClick={() => setFolder("")}>
              <h2>{folder}</h2>
              <div className="folder-apps" onClick={(e) => e.stopPropagation()}>
                {apps
                  .filter((a) => a.folder === folder)
                  .map((a) => (
                    <button key={a.id} onClick={() => open(a.id)}>
                      <AppIcon id={a.id} name={a.name} custom={a.icon} />
                    </button>
                  ))}
              </div>
              <button className="glass-btn" onClick={() => setFolder("")}>
                关闭文件夹
              </button>
            </div>
          )}
          {panel === "control" && (
            <ControlCenter
              battery={work.phone.battery}
              network={work.phone.network}
              close={() => setPanel("")}
            />
          )}
          {panel && panel !== "control" && panel !== "switcher" && (
            <div
              className={`system-panel ${panel === "light" ? "flash-on" : ""}`}
            >
              <button className="panel-close" onClick={() => setPanel("")}>
                关闭 <ChevronLeft size={14} />
              </button>
              {panel === "notification" ? (
                <>
                  <h2>通知中心</h2>
                  {work.phone.notifications && s.notifications.length ? (
                    <SystemNotifications
                      notices={s.notifications}
                      apps={work.apps}
                      onOpen={() => {
                        setPanel("");
                        if (locked) beginUnlock();
                        else if (installedApps.some((a) => a.id === "messages"))
                          open("messages");
                      }}
                      onDismiss={dismissNotice}
                    />
                  ) : (
                    <p>没有新通知</p>
                  )}
                </>
              ) : panel === "search" && !restricted ? (
                <>
                  <h2>搜索 App</h2>
                  <AppSearch apps={installedApps} open={open} />
                </>
              ) : (
                <h2>手电筒已打开</h2>
              )}
            </div>
          )}
          {!creator && s.choices.length > 0 && !locked && (
            <div className="story-overlay">
              <span className="eyebrow">故事来到一个岔路口</span>
              <h3>你会如何选择？</h3>
              {s.choices.map((c) => (
                <button
                  key={c.target}
                  onClick={() => update(choose(work, s, c.target))}
                >
                  {c.label}
                  <ArrowUp size={15} />
                </button>
              ))}
            </div>
          )}
          {!creator && s.endings.length > 0 && !locked && (
            <div className="story-overlay ending">
              <span className="eyebrow">ENDING · {s.endings.length}</span>
              <h2>故事在这里停泊。</h2>
              <p>{s.endings[s.endings.length - 1]}</p>
              <button
                onClick={() => {
                  update(dispatch(work, initialRuntime(work), "start"));
                  setApp("");
                  setLocked(true);
                }}
              >
                重新开始
              </button>
            </div>
          )}
          {!creator && s.incomingCall && (
            <div className="incoming-call-screen">
              <small>
                {s.incomingCall.status === "ringing" ? "来电" : "通话中"} ·
                作品内模拟
              </small>
              <div className="incoming-avatar">
                {s.incomingCall.caller.slice(0, 1)}
              </div>
              <h2>{s.incomingCall.caller}</h2>
              {s.incomingCall.status === "answered" &&
                (() => {
                  const record = work.data.phone?.find(
                    (i) => i.id === s.incomingCall?.target,
                  );
                  return record?.kind === "audio" && safeMedia(record.media) ? (
                    <audio preload="none" controls src={safeMedia(record.media)} />
                  ) : (
                    <p>这是一通虚构来电。</p>
                  );
                })()}
              <div className="incoming-actions">
                <button
                  className="decline-call"
                  onClick={() => {
                    const call = runtimeRef.current.incomingCall;
                    if (call)
                      update(
                        dispatch(
                          work,
                          { ...runtimeRef.current, incomingCall: null },
                          call.status === "ringing"
                            ? "callDeclined"
                            : "callEnded",
                          call.target || call.caller,
                        ),
                      );
                  }}
                >
                  <PhoneIcon size={25} />
                  <span>
                    {s.incomingCall.status === "ringing" ? "拒接" : "挂断"}
                  </span>
                </button>
                {s.incomingCall.status === "ringing" && (
                  <button
                    className="accept-call"
                    onClick={() => {
                      const call = runtimeRef.current.incomingCall;
                      if (call)
                        update(
                          dispatch(
                            work,
                            {
                              ...runtimeRef.current,
                              incomingCall: { ...call, status: "answered" },
                            },
                            "callAnswered",
                            call.target || call.caller,
                          ),
                        );
                    }}
                  >
                    <PhoneIcon size={25} />
                    <span>接听</span>
                  </button>
                )}
              </div>
            </div>
          )}
          {banner && !locked && (
            <button
              className="device-banner"
              onClick={() => {
                setBanner("");
                setPanel("notification");
              }}
            >
              <AppIcon
                id={notificationContent(banner, work.apps).appId}
                small
              />
              <span>
                <strong>{notificationContent(banner, work.apps).title}</strong>
                <span>{notificationContent(banner, work.apps).body}</span>
              </span>
            </button>
          )}
          {panel === "switcher" && (
            <div className="device-switcher">
              <div className="switcher-cards">
                {recent
                  .filter(
                    (id) =>
                      installedApps.some((a) => a.id === id) &&
                      appSnapshots.current.has(id),
                  )
                  .map((id) => (
                    <button
                      className="recent-app-card"
                      key={id}
                      onClick={() => open(id)}
                    >
                      <span className="recent-app-label">
                        <AppIcon id={id} small />
                        <strong>
                          {work.apps.find((a) => a.id === id)?.name}
                        </strong>
                      </span>
                      <span className="recent-app-window">
                        <span
                          className="recent-app-snapshot"
                          aria-hidden="true"
                          inert
                          ref={(el) => {
                            const snapshot = appSnapshots.current.get(id);
                            if (el && snapshot)
                              el.replaceChildren(snapshot.cloneNode(true));
                          }}
                        />
                      </span>
                    </button>
                  ))}
              </div>
              <button className="switcher-done" onClick={() => setPanel("")}>
                完成
              </button>
            </div>
          )}
          {contextApp && (
            <div
              className="home-context-shade"
              onClick={() => setContextApp("")}
            >
              <div className="home-context-menu">
                <AppIcon id={contextApp} />
                <strong>
                  {work.apps.find((a) => a.id === contextApp)?.name}
                </strong>
                <button
                  onClick={() => {
                    open(contextApp);
                    setContextApp("");
                  }}
                >
                  打开 App
                </button>
{!restricted && <button
                  onClick={() => {
                    setContextApp("");
                    if (!restricted) setPanel("search");
                  }}
                >
                  在 App 库中查看
                </button>}
                <button onClick={() => setContextApp("")}>取消</button>
              </div>
            </div>
          )}
          {phoneCalls.overlay}
          {keyboard && <DeviceKeyboard binding={freeKeyboard} scriptedText={scriptDraft ?? undefined} close={() => setKeyboard(false)} />}
          {!creator && <MessageBanner messages={storyUnread} activeThread={app === "wechat" ? activeChat : ""} open={(item) => { open("wechat"); setStoryRoute({serial:Date.now(),app:"wechat",thread:item.title}); }} />}
          {!creator && !locked && s.variables.noteReady && !s.unlocked.includes("interlude-note") && <div className="story-modal-shade"><div className="story-modal" role="dialog" aria-modal="true" aria-label="新的备忘录"><p>您已解锁一条新的备忘录，是否查看？</p><button onClick={() => { event("storyConsent", "interlude-note"); open("notes"); setStoryRoute({serial:Date.now(),app:"notes",note:"interlude-note"}); }}>是</button></div></div>}
          {!creator && s.variables.meetReady && !s.variables.meetAccepted && <div className="story-modal-shade"><div className="story-modal" role="dialog" aria-modal="true" aria-label="与左航聊一聊"><p>与左航聊一聊？</p><button onClick={() => {setKeyboard(false);setScriptDraft(null);event("meetConsent","left");}}>是</button></div></div>}
          {!creator && s.variables.meetBlackout && <div className="story-blackout" role="status" aria-label="正在与左航聊一聊" />}
          {loadError && (
            <button className="runtime-error" onClick={() => setLoadError("")}>
              {loadError}
            </button>
          )}
          {restricted ? <div className="home-indicator" aria-hidden="true" style={{ pointerEvents: "none" }} /> : <button
            className="home-indicator"
            aria-label="返回桌面"
            onClick={() => {
              if (gestureConsumed.current) return;
              if (locked) {
                beginUnlock();
                return;
              }
              returnHome();
            }}
          />}
          <div className="screen-dimmer" />
          <div className="hardware-reflection" />
        </div>
      </FreeKeyboardContext.Provider>
      </ScriptKeyboardContext.Provider>
      </KeyboardContext.Provider>
      </PhoneCallContext.Provider>
    </div>
  );
}
function AppSearch({
  apps,
  open,
}: {
  apps: Work["apps"];
  open: (id: string) => void;
}) {
  const [q, set] = useState("");
  return (
    <>
      <input
        autoFocus
        value={q}
        placeholder="App 名称"
        onChange={(e) => set(e.target.value)}
      />
      {apps
        .filter((a) => a.name.toLowerCase().includes(q.toLowerCase()))
        .map((a) => (
          <button
            className="search-result"
            key={a.id}
            onClick={() => open(a.id)}
          >
            <AppIcon id={a.id} small />
            {a.name}
          </button>
        ))}
    </>
  );
}
function Media({ item }: { item: Item }) {
  const src = safeMedia(item.media);
  return src ? (
    item.kind === "audio" ? (
      <audio preload="none" controls src={src} />
    ) : item.kind === "video" ? (
      <video preload="none" controls playsInline src={src} />
    ) : (
      <img decoding="async" loading="lazy" src={src} alt={item.title} />
    )
  ) : (
    <div
      className={`original-art art-${item.id.includes("ticket") ? "ticket" : "rain"}`}
    >
      <span>
        {item.id.includes("ticket") ? "城南 / SOUTHBOUND" : "after the rain"}
      </span>
      <strong>{item.id.includes("ticket") ? "09 · 01" : "雨 后"}</strong>
      <small>
        {item.id.includes("ticket")
          ? "16:30 · 一张未完成的约定"
          : "a little moment of quiet"}
      </small>
    </div>
  );
}
function AppContent({
  route,
  onThreadChange,
  onStorySend,
  onFreeSend,
  onStoryDraft,
  app,
  name,
  items,
  creator,
  state,
  onRead,
  onEdit,
  onAdd,
  onBack,
  onSettings,
  onUi,
  work,
}: {
  route?: StoryRoute;
  onThreadChange?: (name: string) => void;
  onStorySend?: (id: string) => void;
  onFreeSend?: (text: string, thread: string) => void;
  onStoryDraft?: (id: string) => void;
  app: AppPlugin;
  name: string;
  items: Item[];
  creator: boolean;
  state: Runtime;
  onRead: (id: string) => void;
  onEdit: (item: Item) => void;
  onAdd: () => void;
  onBack: () => void;
  onSettings?: () => void;
  onUi?: (key: string, value: UiValue) => void;
  work: Work;
}) {
  const [detail, setDetail] = useState<Item | null>(null);
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [thread, setThread] = useState("");
  useStoryRoute(route, app.id, items, onRead, setDetail, setThread);
  useEffect(() => { onThreadChange?.(thread); }, [thread, onThreadChange]);
  const [tab, setTab] = useState(app.tabs[0]);
  const [q, setQ] = useState("");
  const [pw, setPw] = useState("");
  const [unlocks, setUnlocks] = useState<string[]>([]);
  const [pwError, setPwError] = useState("");
  const [likes, setLikes] = useState<string[]>([]);
  const shown = items
    .map(i => !creator && app.id === "wechat" ? messageArrivalTime(i, state) : i)
    .filter((i) => creator || visible(i, state) || (app.id === "notes" && !!lockedNotePreview(i, state, work.id)))
    .map(i => !creator && app.id === "notes" ? lockedNotePreview(i, state, work.id) ?? i : i)
    .filter((i) => creator || app.id !== "photos" || i.folder !== "已隐藏" || hiddenAlbumUnlocked(state))
    .filter((i) =>
      (i.title + i.body + i.sender).toLowerCase().includes(q.toLowerCase()),
    );
  const filtered =
    tab === "收藏"
      ? shown.filter((i) => i.favorite)
      : tab === app.tabs[0]
        ? shown
        : shown.filter((i) => i.folder === tab);
  const read = (i: Item, sequence?: string[]) => {
    if (!creator && i.meta.lockedPreview === "true") return;
    if (creator) {
      onEdit(i);
      return;
    }
    if (app.id === "files" && i.id === "fengqing-wanzhong-video") {
      window.open("https://b23.tv/OiKr6Fe", "_blank", "noopener,noreferrer");
      onRead(i.id);
      return;
    }
    if (app.id === "files" && i.id === "love-unsaid-video") {
      window.open("https://b23.tv/Ed8VDQD", "_blank", "noopener,noreferrer");
      onRead(i.id);
      return;
    }
    if (app.id === "files" && i.id === "lover-not-yet-video") {
      window.open("https://b23.tv/0u5ZL0f", "_blank", "noopener,noreferrer");
      onRead(i.id);
      return;
    }
    if (app.id === "photos" && sequence) setPhotoIds(sequence);
    setDetail(i);
    if (!i.password || unlocks.includes(i.id)) onRead(i.id);
  };
  const chats = [...new Set(shown.map((i) => i.title))];
  const back = () => {
    if (detail) setDetail(null);
    else if (thread) setThread("");
    else onBack();
  };
  const Skin =
    app.id === "wechat"
      ? WeChatSkin
      : app.id === "whatsapp"
        ? WhatsAppSkin
        : (catalogSkins[app.id as keyof typeof catalogSkins] ?? null);
  const detailView = detail ? (
    <div className="phone-content detail-content">
      {detail.password && !creator && !unlocks.includes(detail.id) ? (
        <div className="locked-note">
          <LockKeyhole size={36} />
          <h3>这条内容已锁定</h3>
          <input
            type="password"
            placeholder="内容密码"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <button
            onClick={() => {
              if (pw === detail.password) {
                setUnlocks([...unlocks, detail.id]);
                onRead(detail.id);
                setPwError("");
              } else setPwError("密码不正确");
            }}
          >
            解锁内容
          </button>
          <small>{pwError}</small>
        </div>
      ) : (
        <>
          <small className="detail-meta">
            {detail.time} · {detail.sender}
          </small>
          <h2>{detail.title}</h2>
          {(detail.media || ["media", "social"].includes(app.engine)) && (
            <Media item={detail} />
          )}
          <RichText value={detail.richText} fallback={detail.body} />
          <dl className="item-metadata">
            {getFields(app.id)
              .filter((f) => detail.meta?.[f.key])
              .map((f) => (
                <div key={f.key}>
                  <dt>{f.label}</dt>
                  <dd>{detail.meta[f.key]}</dd>
                </div>
              ))}
          </dl>
          {detail.folder && (
            <span className="folder-label">
              <Folder size={12} />
              {detail.folder}
            </span>
          )}
          {detail.comments.map((c, i) => (
            <p key={i} className="comment">
              {c}
            </p>
          ))}
        </>
      )}
    </div>
  ) : null;
  if (app.id === "weather" && work.id === "phone-a-story" && !creator)
    return <WeatherApp />;
  if (app.id === "clock" && work.id === "phone-a-story" && !creator)
    return <BeijingClockApp />;
  if (app.id === "phone" && work.id === "phone-a-story" && !creator)
    return <div className="catalog-slot"><StoryPhoneApp contacts={shown} /></div>;
  if (Skin)
    return (
      <>
        <div className="catalog-slot" hidden={!!detail}>
          <Suspense fallback={<div className="catalog-loading">正在打开…</div>}>
            <Skin
              arrivalIds={state.unlocked}
              readIds={state.read}
              interlude={!!state.variables.interludeEnabled}
              onStoryDraft={onStoryDraft}
              onStorySend={onStorySend}
              onFreeSend={onFreeSend}
              allFreeChat={allChatsFree(state)}
              hiddenAlbumUnlocked={creator || work.id !== "phone-a-story" || hiddenAlbumUnlocked(state)}
              appId={app.id}
              owner={work.phone.owner}
              virtualTime={state.time}
              ui={state.ui?.[app.id]}
              onUi={creator ? undefined : onUi}
              name={name}
              items={shown}
              creator={creator}
              onRead={onRead}
              onItem={read}
              onAdd={onAdd}
              onBack={onBack}
              thread={thread}
              onThread={setThread}
            />
          </Suspense>
        </div>
        {detail &&
          (socialDetailApps.has(app.id) &&
          (!detail.password || unlocks.includes(detail.id)) ? (
            <SocialDetail
              app={app.id}
              item={detail}
              back={back}
              owner={work.phone.owner}
              ui={state.ui?.[app.id]}
              onUi={onUi}
            />
          ) : nativeDetailApps.has(app.id) &&
            (!detail.password || unlocks.includes(detail.id)) ? (
            <NativeDetail key={app.id === "photos" ? detail.id : app.id} app={app.id} item={detail} back={back} photos={app.id === "photos" ? photoSequence(shown, photoIds) : undefined} onPhoto={app.id === "photos" ? read : undefined} />
          ) : (
            <>
              <div className="app-nav">
                <button aria-label="返回" onClick={back}>
                  <ChevronLeft size={23} />
                </button>
                <strong>{detail.title}</strong>
                <span />
              </div>
              {detailView}
            </>
          ))}
      </>
    );
  return (
    <>
      <div className="app-nav">
        <button onClick={back} aria-label="返回">
          <ChevronLeft size={23} />
          {detail || thread ? "返回" : ""}
        </button>
        <strong>{thread || name}</strong>
        <button
          onClick={
            creator
              ? onAdd
              : () =>
                  document
                    .querySelector<HTMLInputElement>(
                      ".app-screen .phone-search input",
                    )
                    ?.focus()
          }
          aria-label={creator ? "新增内容" : "搜索内容"}
        >
          {creator ? <Plus size={22} /> : <Search size={20} />}
        </button>
      </div>
      {app.id === "weather" && work.id === "phone-a-story" && !creator && !detail ? (
        <WeatherApp />
      ) : app.id === "settings" && !detail ? (
        <NativeSettings
          work={work}
          items={shown}
          creator={creator}
          onItem={read}
          onSettings={onSettings}
        />
      ) : app.id === "calculator" && !detail ? (
        <NativeCalculator
          items={shown}
          onRead={read}
          ui={state.ui?.[app.id]}
          onUi={onUi}
        />
      ) : detail ? (
        detailView
      ) : app.engine === "messaging" && thread ? (
        <div className="chat-content">
          <div className="chat-time">2026 年 9 月 1 日</div>
          {shown
            .filter((i) => i.title === thread)
            .map((i) => (
              <button
                key={i.id}
                className={`message-row ${i.outgoing ? "outgoing" : ""}`}
                onClick={() => (creator ? onEdit(i) : onRead(i.id))}
              >
                <span className="avatar">{i.sender.slice(0, 1)}</span>
                <span className="bubble">
                  {i.kind === "image" ||
                  i.kind === "audio" ||
                  i.kind === "video" ? (
                    <Media item={i} />
                  ) : i.kind === "transfer" ? (
                    <span className="transfer">
                      ¥ {i.body}
                      <small>虚构转账记录</small>
                    </span>
                  ) : (
                    i.body
                  )}
                  <small>
                    {i.time.slice(-5)} {i.read ? "✓✓" : ""}
                  </small>
                  {creator && (i.hidden || i.unlock) && (
                    <LockKeyhole size={12} />
                  )}
                </span>
              </button>
            ))}
          {creator ? (
            <button className="chat-compose" onClick={onAdd}>
              ＋ 添加一条消息
            </button>
          ) : (
            <div className="chat-compose muted">
              根据剧情推进，互动回复将在这里出现。
            </div>
          )}
        </div>
      ) : (
        <div
          className={`phone-content ${app.engine === "social" ? "feed-content" : ""}`}
        >
          {app.engine !== "media" && (
            <div className="phone-search">
              <Search size={15} />
              <input
                placeholder={`搜索${name}`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          )}
          {app.engine === "messaging" ? (
            chats.map((t) => {
              const list = shown.filter((i) => i.title === t),
                last = list[list.length - 1];
              return (
                <button
                  className="contact-row"
                  key={t}
                  onClick={() => {
                    setThread(t);
                    onRead(t);
                  }}
                >
                  <span className="avatar" style={{ background: app.color }}>
                    {t.slice(0, 1)}
                  </span>
                  <span>
                    <strong>{t}</strong>
                    <p>{last.body}</p>
                  </span>
                  <small>{last.time.slice(-5)}</small>
                </button>
              );
            })
          ) : app.engine === "media" ? (
            <>
              <div className="media-heading">
                <h1>{tab}</h1>
                <p>{filtered.length} 个故事片段</p>
              </div>
              <div className="media-grid">
                {filtered.map((i) => (
                  <button key={i.id} onClick={() => read(i)}>
                    <Media item={i} />
                    <span>
                      {i.title} {creator && i.hidden ? "· 隐藏" : ""}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : app.engine === "social" ? (
            filtered.map((i) => (
              <article className="social-post" key={i.id}>
                <div className="post-author">
                  <span className="avatar" style={{ background: app.color }}>
                    {i.sender.slice(0, 1)}
                  </span>
                  <div>
                    <strong>{i.sender}</strong>
                    <small>{i.time}</small>
                  </div>
                  <button aria-label="查看帖子详情" onClick={() => read(i)}>
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                <button className="post-image" onClick={() => read(i)}>
                  <Media item={i} />
                </button>
                <div className="post-actions">
                  <button
                    aria-label="虚构点赞"
                    onClick={() =>
                      setLikes(
                        likes.includes(i.id)
                          ? likes.filter((id) => id !== i.id)
                          : [...likes, i.id],
                      )
                    }
                  >
                    <Heart
                      size={22}
                      fill={likes.includes(i.id) ? "#d67670" : "none"}
                    />
                  </button>
                  <button aria-label="查看评论" onClick={() => read(i)}>
                    <MessageCircle size={22} />
                  </button>
                  <small>
                    {i.likes + (likes.includes(i.id) ? 1 : 0)} 次虚构喜欢
                  </small>
                </div>
                <button className="post-text" onClick={() => read(i)}>
                  <strong>{i.title}</strong>
                  <p>{i.body}</p>
                </button>
              </article>
            ))
          ) : (
            filtered.map((i) => (
              <button
                key={i.id}
                className={`record-row ${app.engine === "document" ? "document-row" : ""}`}
                onClick={() => read(i)}
              >
                <div className="record-symbol">
                  {app.engine === "records" ? (
                    <app.icon size={20} />
                  ) : (
                    <span>{i.title.slice(0, 1)}</span>
                  )}
                </div>
                <div>
                  <strong>{i.title}</strong>
                  <p>{i.body.split("\n")[0]}</p>
                  <small>
                    {i.time} {i.folder && `· ${i.folder}`}
                  </small>
                </div>
                {i.password || i.hidden ? (
                  <LockKeyhole size={14} />
                ) : (
                  <ChevronLeft className="chevron-right" size={16} />
                )}
              </button>
            ))
          )}
          {!filtered.length && app.engine !== "messaging" && (
            <div className="empty-app">
              <app.icon size={36} />
              <h3>这一页还很安静</h3>
              <p>
                {creator
                  ? "添加属于这个 App 的故事内容。"
                  : "暂时没有可浏览的内容。"}
              </p>
            </div>
          )}
          {creator && (
            <button className="phone-add" onClick={onAdd}>
              <Plus size={15} />
              添加
              {app.engine === "messaging"
                ? "聊天"
                : app.engine === "social"
                  ? "帖子"
                  : app.engine === "media"
                    ? "素材"
                    : "内容"}
            </button>
          )}
        </div>
      )}
      {!detail &&
        !thread &&
        app.id !== "calculator" &&
        app.id !== "settings" && (
          <div className="app-tabs">
            {app.tabs.map((t, i) => (
              <button
                key={t}
                className={tab === t ? "selected" : ""}
                onClick={() => setTab(t)}
              >
                {i === 0 ? (
                  <MessageCircle size={17} />
                ) : i === 1 ? (
                  <Search size={17} />
                ) : (
                  <UsersIcon />
                )}
                <span>{t}</span>
              </button>
            ))}
          </div>
        )}
    </>
  );
}
function UsersIcon() {
  return <PhoneIcon size={17} />;
}
