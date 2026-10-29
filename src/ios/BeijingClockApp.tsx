import { useEffect, useState } from "react";
import { AlarmClock, Globe2, Timer, CircleGauge, Plus, Play, Pause, RotateCcw } from "lucide-react";
import "./beijing-clock.css";

type Tab = "world" | "alarm" | "stopwatch" | "timer";
type Alarm = { id: number; time: string; label: string; on: boolean };
const zone = "Asia/Shanghai";
const beijingTime = new Intl.DateTimeFormat("zh-CN", { timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: false });
const clockDate = new Intl.DateTimeFormat("zh-CN", { timeZone: zone, month: "long", day: "numeric", weekday: "long" });
const pad = (n: number) => String(n).padStart(2, "0");
const displayDuration = (seconds: number) => `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds % 3600 / 60))}:${pad(seconds % 60)}`;
export function BeijingClockApp() {
  const [tab, setTab] = useState<Tab>("world");
  const [now, setNow] = useState(() => new Date());
  const [alarms, setAlarms] = useState<Alarm[]>([
    { id: 1, time: "08:30", label: "起床", on: true },
    { id: 2, time: "09:30", label: "上课", on: true },
  ]);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [alarmTime, setAlarmTime] = useState("07:00");
  const [alarmLabel, setAlarmLabel] = useState("闹钟");
  const [swRunning, setSwRunning] = useState(false);
  const [swMs, setSwMs] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const [timerHours, setTimerHours] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!swRunning) return;
    const start = performance.now() - swMs;
    const interval = window.setInterval(() => setSwMs(performance.now() - start), 30);
    return () => window.clearInterval(interval);
  }, [swRunning]);
  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => setTimerRemaining(prev => {
      if (prev === null || prev <= 1) { setTimerRunning(false); return 0; }
      return prev - 1;
    }), 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);
  const changeTab = (next: Tab) => { setTab(next); setEditing(false); setAdding(false); };
  const saveAlarm = () => {
    setAlarms(prev => [...prev, { id: Date.now(), time: alarmTime, label: alarmLabel.trim() || "闹钟", on: true }].sort((a, b) => a.time.localeCompare(b.time)));
    setAdding(false);
  };
  const startTimer = () => {
    if (timerRemaining === null || timerRemaining === 0) {
      const duration = timerHours * 3600 + timerMinutes * 60 + timerSeconds;
      if (!duration) return;
      setTimerRemaining(duration);
    }
    setTimerRunning(true);
  };
  return <section className="phone-a-clock" aria-label="时钟">
    <main className="pa-clock-body">
      {tab === "world" && <>
        <div className="pa-clock-actions"><button onClick={() => setEditing(!editing)}>编辑</button><button aria-label="添加城市" onClick={() => setEditing(!editing)}><Plus size={26}/></button></div>
        <h1>世界时钟</h1>
        <div className="pa-world-row"><div><small>今天 +0 小时</small><strong>北京</strong></div><time>{beijingTime.format(now)}</time></div>
        <p className="pa-clock-hint">北京时间 · UTC+8 · {clockDate.format(now)}</p>
        {editing && <p className="pa-clock-hint">当前仅设置北京时间。</p>}
      </>}
      {tab === "alarm" && <>
        <div className="pa-clock-actions"><button onClick={() => setEditing(!editing)}>{editing ? "完成" : "编辑"}</button><button aria-label="添加闹钟" onClick={() => { setAlarmTime("07:00"); setAlarmLabel("闹钟"); setAdding(true); }}><Plus size={26}/></button></div>
        <h1>闹钟</h1>
        <h3 className="pa-alarm-section">▰ 睡眠 | 起床闹钟</h3>
        <div className="pa-sleep-row"><span><strong>无闹钟</strong><small>今天上午</small></span><span className="pa-edit-pill">更改</span></div>
        <h3 className="pa-alarm-section">其他</h3>
        <div className="pa-alarm-list">{alarms.map(alarm => <div className={"pa-alarm-row" + (alarm.on ? "" : " off")} key={alarm.id}>
          <div><strong>{alarm.time}</strong><small>{alarm.label}</small></div>
          {editing ? <button className="pa-delete-alarm" onClick={() => setAlarms(prev => prev.filter(a => a.id !== alarm.id))}>删除</button> :
            <label className="pa-alarm-toggle"><input type="checkbox" checked={alarm.on} onChange={e => setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, on: e.target.checked } : a))} /><span/></label>}
        </div>)}</div>
        {adding && <div className="pa-alarm-modal"><div className="pa-alarm-dialog"><h3>添加闹钟</h3><label>时间<input type="time" value={alarmTime} onChange={e => setAlarmTime(e.target.value)} /></label><label>标签<input value={alarmLabel} onChange={e => setAlarmLabel(e.target.value)} /></label><div><button onClick={() => setAdding(false)}>取消</button><button onClick={saveAlarm}>存储</button></div></div></div>}
      </>}
      {tab === "stopwatch" && <>
        <div className="pa-stopwatch-time">{pad(Math.floor(swMs / 3600000))}:{pad(Math.floor(swMs / 60000) % 60)}.{pad(Math.floor(swMs / 1000) % 60)}<span>.{pad(Math.floor(swMs / 10) % 100)}</span></div>
        <div className="pa-clock-controls"><button className="pa-control-muted" onClick={() => { if (swRunning) setLaps(prev => [swMs, ...prev]); else { setSwMs(0); setLaps([]); } }}>{swRunning ? "计次" : "归零"}</button><button className={swRunning ? "pa-control-red" : "pa-control-green"} onClick={() => setSwRunning(v => !v)}>{swRunning ? "停止" : "启动"}</button></div>
        <div className="pa-laps">{laps.map((lap, i) => <div key={i}>计次 {laps.length - i}<span>{(lap / 1000).toFixed(2)} 秒</span></div>)}</div>
      </>}
      {tab === "timer" && <>
        <div className="pa-timer-picker">{(["hours", "minutes", "seconds"] as const).map((unit) => {
          const val = unit === "hours" ? timerHours : unit === "minutes" ? timerMinutes : timerSeconds;
          const setter = unit === "hours" ? setTimerHours : unit === "minutes" ? setTimerMinutes : setTimerSeconds;
          return <label key={unit}><input type="number" min="0" max={unit === "hours" ? 23 : 59} value={val} disabled={timerRunning} onChange={e => { setter(Math.max(0, Math.min(unit === "hours" ? 23 : 59, Number(e.target.value) || 0))); setTimerRemaining(null); }} /><span>{unit === "hours" ? "小时" : unit === "minutes" ? "分钟" : "秒"}</span></label>;
        })}</div>
        {timerRemaining !== null && <div className="pa-timer-remaining">{displayDuration(timerRemaining)}</div>}
        <div className="pa-clock-controls"><button className="pa-control-muted" onClick={() => { setTimerRunning(false); setTimerRemaining(null); }}>取消</button><button className={timerRunning ? "pa-control-red" : "pa-control-green"} onClick={() => timerRunning ? setTimerRunning(false) : startTimer()}>{timerRunning ? <Pause size={22}/> : <Play size={22}/>}</button></div>
        <div className="pa-timer-settings"><div>标签 <span>计时器</span></div><div>铃声 <span>射线 ›</span></div></div>
        <h3 className="pa-alarm-section">最近使用</h3>
        <div className="pa-recent-timer"><span>15:00 <small>15 分钟</small></span><button onClick={() => { setTimerHours(0); setTimerMinutes(15); setTimerSeconds(0); setTimerRemaining(900); setTimerRunning(true); }}><Play size={22}/></button></div>
      </>}
    </main>
    <nav className="pa-clock-nav" aria-label="时钟栏目">
      {([{ id: "world", title: "世界时钟", Icon: Globe2 }, { id: "alarm", title: "闹钟", Icon: AlarmClock }, { id: "stopwatch", title: "秒表", Icon: CircleGauge }, { id: "timer", title: "计时器", Icon: Timer }] as const).map(item => <button type="button" key={item.id} className={tab === item.id ? "selected" : ""} onClick={() => changeTab(item.id)}><item.Icon size={23}/><span>{item.title}</span></button>)}
    </nav>
  </section>;
}
