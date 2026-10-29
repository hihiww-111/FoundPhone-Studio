import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Cloud, CloudDrizzle, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Droplets, Map, MoreHorizontal, RefreshCw, Search, Sun, Wind } from "lucide-react";
import "./weather-app.css";

type City = { id: string; name: string; region: string; latitude: number; longitude: number };
type Weather = {
  temperature: number; code: number; high: number; low: number; time: string; isDay: boolean;
  hourly: { times: string[]; temps: number[]; codes: number[]; rain: number[] };
  daily: { times: string[]; highs: number[]; lows: number[]; codes: number[]; rain: number[] };
  humidity: number | null; wind: number | null;
};
const CITIES: City[] = [
  { id: "beijing", name: "北京", region: "北京市", latitude: 39.9042, longitude: 116.4074 },
  { id: "jintan", name: "金坛", region: "江苏省常州市", latitude: 31.744, longitude: 119.577 },
  { id: "qijiang", name: "綦江", region: "重庆市", latitude: 28.965, longitude: 106.651 },
  { id: "kuala-lumpur", name: "吉隆坡", region: "马来西亚", latitude: 3.139, longitude: 101.687 },
  { id: "quanzhou", name: "泉州", region: "福建省", latitude: 24.874, longitude: 118.676 },
  { id: "haikou", name: "海口", region: "海南省", latitude: 20.045, longitude: 110.199 },
  { id: "macau", name: "澳门", region: "澳门特别行政区", latitude: 22.1987, longitude: 113.5439 },
  { id: "qingdao", name: "青岛", region: "山东省", latitude: 36.067, longitude: 120.383 },
  { id: "xuzhou", name: "徐州", region: "江苏省", latitude: 34.262, longitude: 117.184 },
];
function condition(code: number) {
  if (code === 0) return "晴朗";
  if (code <= 2) return "局部多云";
  if (code === 3) return "多云";
  if (code === 45 || code === 48) return "有雾";
  if (code <= 57) return "毛毛雨";
  if (code <= 67) return "小雨";
  if (code <= 77) return "降雪";
  if (code <= 82) return "阵雨";
  if (code <= 86) return "阵雪";
  if (code >= 95) return "雷阵雨";
  return "多云";
}
function rainCode(code: number) { return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95; }
function WeatherIcon({ code, isDay = true, size = 28 }: { code: number; isDay?: boolean; size?: number }) {
  const props = { size, strokeWidth: 1.8, "aria-hidden": true as const };
  if (code === 0) return isDay ? <Sun {...props} /> : <CloudMoon {...props} />;
  if (code >= 95) return <CloudLightning {...props} />;
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <CloudSnow {...props} />;
  if (code >= 61 && code <= 67 || code >= 80 && code <= 82) return <CloudRain {...props} />;
  if (code >= 51 && code <= 57) return <CloudDrizzle {...props} />;
  if (code === 3 || code === 45 || code === 48) return <Cloud {...props} />;
  return isDay ? <CloudSun {...props} /> : <CloudMoon {...props} />;
}
const degree = (value: number) => Math.round(value) + "°";
function scene(w?: Weather) {
  if (!w) return "night";
  if (!w.isDay) return "night";
  if (rainCode(w.code)) return "rain";
  if (w.code === 0) return "sun";
  return "cloud";
}
function localHour(time: string) { return Number(time.slice(11, 13)); }
function dayLabel(date: string, index: number) {
  if (index === 0) return "今天";
  return new Intl.DateTimeFormat("zh-CN", { weekday: "short", timeZone: "UTC" }).format(new Date(date + "T12:00:00Z"));
}
export function WeatherApp() {
  const [data, setData] = useState<Record<string, Weather>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function load() {
      setLoading(true);
      const results = await Promise.allSettled(CITIES.map(async city => {
        const query = new URLSearchParams({
          latitude: String(city.latitude), longitude: String(city.longitude),
          current: "temperature_2m,weather_code,is_day,relative_humidity_2m,wind_speed_10m",
          hourly: "temperature_2m,weather_code,precipitation_probability",
          daily: "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
          forecast_days: "7", timezone: "auto"
        });
        const response = await fetch("https://api.open-meteo.com/v1/forecast?" + query, { signal: controller.signal });
        if (!response.ok) throw Error("Weather request failed");
        const j = await response.json();
        const cur = j.current, h = j.hourly, d = j.daily;
        if (!cur || !h || !d || ![cur.temperature_2m, cur.weather_code, d.temperature_2m_max?.[0], d.temperature_2m_min?.[0]].every(Number.isFinite)) throw Error("Invalid weather response");
        const weather: Weather = {
          temperature: cur.temperature_2m, code: cur.weather_code, high: d.temperature_2m_max[0], low: d.temperature_2m_min[0],
          time: cur.time || "", isDay: cur.is_day === 1,
          hourly: { times: h.time || [], temps: h.temperature_2m || [], codes: h.weather_code || [], rain: h.precipitation_probability || [] },
          daily: { times: d.time || [], highs: d.temperature_2m_max || [], lows: d.temperature_2m_min || [], codes: d.weather_code || [], rain: d.precipitation_probability_max || [] },
          humidity: Number.isFinite(cur.relative_humidity_2m) ? cur.relative_humidity_2m : null,
          wind: Number.isFinite(cur.wind_speed_10m) ? cur.wind_speed_10m : null
        };
        return { id: city.id, weather };
      }));
      if (!active) return;
      const next: Record<string, Weather> = {}, failed: string[] = [];
      results.forEach((result, i) => result.status === "fulfilled" ? next[result.value.id] = result.value.weather : failed.push(CITIES[i].id));
      setData(old => ({ ...old, ...next }));
      setErrors(failed);
      setLoading(false);
    }
    void load();
    const interval = setInterval(() => void load(), 15 * 60 * 1000);
    return () => { active = false; controller.abort(); clearInterval(interval); };
  }, [refresh]);
  const city = CITIES.find(c => c.id === selected);
  const w = city ? data[city.id] : undefined;
  const filtered = CITIES.filter(c => (c.name + c.region).includes(search.trim()));
  const hourlyStart = useMemo(() => {
    if (!w) return 0;
    const index = w.hourly.times.findIndex(t => t >= w.time.slice(0, 13) + ":00");
    return Math.max(0, index);
  }, [w]);
  const minTemp = w ? Math.min(...w.daily.lows) : 0;
  const maxTemp = w ? Math.max(...w.daily.highs) : 1;
  return (
    <section className={"phone-a-weather phone-a-weather-" + (city ? "detail " + scene(w) : "list")} aria-label="实时天气">
      {city ? <>
        <div className="paw-detail-top"><button type="button" onClick={() => setSelected(null)} aria-label="返回城市列表"><ChevronLeft size={23} /> <span>天气</span></button><span className="paw-detail-region">{city.region}</span><button type="button" onClick={() => setRefresh(n => n + 1)} aria-label="刷新天气"><MoreHorizontal size={23} /></button></div>
        <div className="paw-hero">
          <span className="paw-hero-location">⌖ {city.name}</span>
          <h2>{city.name}</h2>
          <div className="paw-hero-temp">{w ? degree(w.temperature) : "—°"}</div>
          <div className="paw-hero-condition">{w ? condition(w.code) : errors.includes(city.id) ? "天气暂不可用" : "正在加载天气…"}</div>
          <div className="paw-hero-range">{w ? `最高 ${degree(w.high)}  最低 ${degree(w.low)}` : ""}</div>
        </div>
        {w && <>
          <div className="paw-panel paw-hourly-panel">
            <div className="paw-panel-label">未来24小时天气</div>
            <div className="paw-hourly-scroll">
              {w.hourly.times.slice(hourlyStart, hourlyStart + 24).map((time, i) => {
                const idx = hourlyStart + i;
                const code = w.hourly.codes[idx] ?? 0;
                return <div className="paw-hour" key={time}><strong>{i === 0 ? "现在" : localHour(time) + "时"}</strong><WeatherIcon code={code} isDay={localHour(time) >= 6 && localHour(time) < 18} size={25}/><span className="paw-rain-chance">{rainCode(code) ? (w.hourly.rain[idx] ?? 0) + "%" : " "}</span><b>{degree(w.hourly.temps[idx])}</b></div>;
              })}
            </div>
          </div>
          <div className="paw-panel paw-daily-panel">
            <div className="paw-panel-label">未来7天天气预报</div>
            {w.daily.times.map((date, i) => {
              const low = w.daily.lows[i], high = w.daily.highs[i], code = w.daily.codes[i] ?? 0;
              const left = maxTemp === minTemp ? 0 : 100 * (low - minTemp) / (maxTemp - minTemp);
              const width = maxTemp === minTemp ? 100 : 100 * (high - low) / (maxTemp - minTemp);
              return <div className="paw-day" key={date}>
                <strong>{dayLabel(date, i)}</strong>
                <span className="paw-day-icon"><WeatherIcon code={code} size={22}/><small>{rainCode(code) ? (w.daily.rain[i] ?? 0) + "%" : ""}</small></span>
                <span className="paw-low">{degree(low)}</span>
                <div className="paw-temp-track"><span style={{ left: left + "%", width: Math.max(width, 3) + "%" }} /></div>
                <span className="paw-high">{degree(high)}</span>
              </div>;
            })}
          </div>
          <div className="paw-metrics"><div className="paw-panel"><div className="paw-panel-label"><Droplets size={15}/> 湿度</div><strong>{w.humidity === null ? "—" : Math.round(w.humidity) + "%"}</strong></div><div className="paw-panel"><div className="paw-panel-label"><Wind size={15}/> 风速</div><strong>{w.wind === null ? "—" : Math.round(w.wind) + " km/h"}</strong></div></div>
          <div className="paw-updated">当地更新时间：{w.time.replace("T", " ")} · Open-Meteo</div>
        </>}
        {!w && <div className="paw-loading">{errors.includes(city.id) ? "天气获取失败，请稍后重试" : "正在获取实时天气…"}</div>}
      </> : <>
        <header className="paw-list-heading"><h2>天气</h2><button type="button" aria-label="刷新天气" onClick={() => setRefresh(n => n + 1)}><MoreHorizontal size={24}/></button></header>
        <div className="paw-city-list">{filtered.map(c => {
          const current = data[c.id];
          return <button type="button" className={"paw-city-card paw-scene-" + scene(current)} key={c.id} onClick={() => setSelected(c.id)}>
            <div className="paw-city-top"><div><strong>{c.name}</strong><small>{c.region}</small></div><span className="paw-city-temp">{current ? degree(current.temperature) : "—°"}</span></div>
            <div className="paw-city-bottom"><span>{current ? condition(current.code) : errors.includes(c.id) ? "暂无天气数据" : "正在更新…"}</span><span>{current ? `最高${degree(current.high)}  最低${degree(current.low)}` : ""}</span></div>
          </button>;
        })}{filtered.length === 0 && <p className="paw-empty">没有找到匹配的城市</p>}</div>
        <div className="paw-search-wrap"><Search size={19}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索城市" aria-label="搜索城市"/></div>
        <div className="paw-list-footer"><Map size={17}/><span>{loading ? "天气更新中…" : "每15分钟更新 · Open-Meteo"}</span><button type="button" aria-label="刷新" onClick={() => setRefresh(n => n + 1)}><RefreshCw size={16}/></button></div>
      </>}
    </section>
  );
}
