import { useEffect, useState } from "react";
import { Clock3, Globe2 } from "lucide-react";
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
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <section className="phone-a-clock" aria-label="世界时钟">
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
      <div className="phone-a-clock-tab"><Clock3 size={19} /><span>世界时钟</span></div>
    </section>
  );
}
