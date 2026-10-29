import { useEffect, useState } from "react";
import { CloudSun, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, RefreshCw } from "lucide-react";
import "./weather-app.css";

type City = { id: string; name: string; region: string; latitude: number; longitude: number };
type Weather = { temperature: number; code: number; high: number; low: number; time: string };
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
  if (code === 0) return "晴";
  if (code <= 2) return "晴间多云";
  if (code === 3) return "阴";
  if (code === 45 || code === 48) return "雾";
  if (code >= 51 && code <= 57) return "毛毛雨";
  if (code >= 61 && code <= 67) return "雨";
  if (code >= 71 && code <= 77) return "雪";
  if (code >= 80 && code <= 82) return "阵雨";
  if (code >= 85 && code <= 86) return "阵雪";
  if (code >= 95) return "雷雨";
  return "多云";
}
function WeatherIcon({ code }: { code: number }) {
  if (code === 0) return <Sun size={34} />;
  if (code >= 95) return <CloudLightning size={34} />;
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <CloudSnow size={34} />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain size={34} />;
  if (code === 3 || code === 45 || code === 48) return <Cloud size={34} />;
  return <CloudSun size={34} />;
}
export function WeatherApp() {
  const [data, setData] = useState<Record<string, Weather>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const load = async () => {
      setLoading(true);
      const results = await Promise.allSettled(CITIES.map(async city => {
        const query = new URLSearchParams({
          latitude: String(city.latitude),
          longitude: String(city.longitude),
          current: "temperature_2m,weather_code",
          daily: "temperature_2m_max,temperature_2m_min",
          forecast_days: "1",
          timezone: "auto",
        });
        const response = await fetch("https://api.open-meteo.com/v1/forecast?" + query, { signal: controller.signal });
        if (!response.ok) throw new Error("天气请求失败");
        const json = await response.json();
        const temperature = json?.current?.temperature_2m;
        const code = json?.current?.weather_code;
        const high = json?.daily?.temperature_2m_max?.[0];
        const low = json?.daily?.temperature_2m_min?.[0];
        if (![temperature, code, high, low].every(Number.isFinite)) throw new Error("天气数据不完整");
        return { id: city.id, weather: { temperature, code, high, low, time: json.current.time || "" } as Weather };
      }));
      if (!active) return;
      const next: Record<string, Weather> = {};
      const failed: string[] = [];
      results.forEach((result, i) => {
        if (result.status === "fulfilled") next[result.value.id] = result.value.weather;
        else failed.push(CITIES[i].id);
      });
      setData(old => ({ ...old, ...next }));
      setErrors(failed);
      setLoading(false);
    };
    void load();
    const timer = setInterval(() => void load(), 15 * 60 * 1000);
    return () => { active = false; controller.abort(); clearInterval(timer); };
  }, [refresh]);
  const city = CITIES.find(c => c.id === selected);
  return (
    <section className="phone-a-weather" aria-label="多城市天气">
      <div className="phone-a-weather-header">
        <div><small>实时天气</small><h2>{city ? city.name : "天气"}</h2></div>
        <button type="button" aria-label={city ? "返回城市列表" : "刷新天气"} onClick={() => city ? setSelected(null) : setRefresh(n => n + 1)}>
          {city ? "全部城市" : <RefreshCw size={20} />}
        </button>
      </div>
      {city ? (
        <div className="phone-a-weather-detail">
          <div className="phone-a-weather-detail-city">{city.region} · {city.name}</div>
          {data[city.id] ? <>
            <WeatherIcon code={data[city.id].code} />
            <div className="phone-a-weather-big-temp">{Math.round(data[city.id].temperature)}°</div>
            <div>{condition(data[city.id].code)}</div>
            <p>最高 {Math.round(data[city.id].high)}° · 最低 {Math.round(data[city.id].low)}°</p>
            <small>当地更新时间：{data[city.id].time.replace("T", " ")}</small>
          </> : <p>{errors.includes(city.id) ? "暂时无法获取天气，请稍后刷新" : "正在获取天气…"}</p>}
        </div>
      ) : (
        <div className="phone-a-weather-cities">
          {CITIES.map(c => {
            const w = data[c.id];
            return <button type="button" key={c.id} className="phone-a-weather-city" onClick={() => setSelected(c.id)}>
              <div className="phone-a-weather-city-top"><span><strong>{c.name}</strong><small>{c.region}</small></span><span className="phone-a-weather-temp">{w ? Math.round(w.temperature) + "°" : "—°"}</span></div>
              <div className="phone-a-weather-city-bottom"><span>{w ? condition(w.code) : errors.includes(c.id) ? "暂时无法获取天气" : "正在加载…"}</span><span>{w ? "最高 " + Math.round(w.high) + "° 最低 " + Math.round(w.low) + "°" : ""}</span></div>
            </button>;
          })}
        </div>
      )}
      <footer className="phone-a-weather-footer">{loading ? "正在更新天气…" : "每15分钟自动更新"} · 数据来源 Open-Meteo</footer>
    </section>
  );
}
