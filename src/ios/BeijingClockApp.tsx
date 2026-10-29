import { useEffect, useState } from "react";
import { AlarmClock, Clock3, Globe2 } from "lucide-react";
import "./beijing-clock.css";

const ZONE = "Asia/Shanghai";
const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: ZONE, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
});
const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: ZONE, year: "numeric", month: "long", day: "numeric", weekday: "long",
});
export function BeijingClockApp() {
  const [now, setNow] = useState(() => new Date());
  const [tab, setTab] = useState<"world" | "alarm">("world");
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ wake: true, class: true });
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 1000);
    const alarms = [{ id: "wake", time: "08:30", label: "起床" }, { id: "class", time: "09:30", label: "上课" }];
  return (
    <section className="phone-a-clock" aria-label="时钟">
      {tab === "world" ? <>
        <header className="phone-a-clock-header"><h2>世界时钟</h2><Globe2 size={24} aria-hidden="true" /></header>
        <div className="phone-a-clock-caption">所有时钟</div>
        <article className="phone-a-clock-city">
          <div className="phone-a-clock-city-info">
            <span className="phone-a-clock-offset">北京时间 · UTC+8</span>
            <strong>北京</strong>
            <span className="phone-a-clock-date">{dateFormatter.format(now)}</span>
          </div>
          <time className="phone-a-clock-time" dateTime={now.toISOString()}>{timeFormatter.format(now)}</time>
        </article>
        <p className="phone-a-clock-note">根据当前时间自动同步，每秒更新。</p>
      </> : <>
        <header className="phone-a-clock-header"><h2>闹钟</h2><AlarmClock size={24} aria-hidden="true" /></header>
        <div className="phone-a-clock-caption">我的闹钟 · 北京时间</div>
        <div className="phone-a-clock-alarms">
          {alarms.map(alarm => <div className={"phone-a-clock-alarm " + (enabled[alarm.id] ? "" : "phone-a-clock-alarm-off")} key={alarm.id}>
            <div><div className="phone-a-clock-alarm-time">{alarm.time}</div><div className="phone-a-clock-alarm-label">{alarm.label} · 每天</div></div>
            <label className="phone-a-clock-switch"><input type="checkbox" checked={!!enabled[alarm.id]} onChange={e => setEnabled(old => ({ ...old, [alarm.id]: e.target.checked }))} aria-label={alarm.label + "闹钟"} /><span /></label>
          </div>)}
        </div>
        <p className="phone-a-clock-note">模拟闹钟：开关控制界面状态，不会触发设备系统闹铃。</p>
      </>}
      <nav className="phone-a-clock-tabs" aria-label="时钟栏目">
        <button type="button" className={tab === "world" ? "active" : ""} onClick={() => setTab("world")}><Globe2 size={21} /><span>世界时钟</span></button>
        <button type="button" className={tab === "alarm" ? "active" : ""} onClick={() => setTab("alarm")}><AlarmClock size={21} /><span>闹钟</span></button>
      </nav>
    </section>
  );
}
