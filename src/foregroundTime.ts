/** Story time advances only while its document is visible. */
export class ForegroundClock {
 constructor(private last: number, private active: boolean) {}
 consume(now: number): number {
  const elapsed = this.active ? Math.max(0, now - this.last) : 0;
  this.last = now;
  return elapsed;
 }
 visibility(active: boolean, now: number): number {
  const elapsed = this.consume(now);
  this.active = active;
  return elapsed;
 }
}

export function foregroundTimeout(callback: () => void, delay: number): () => void {
 let remaining = Math.max(0, delay), started = 0;
 let timer: ReturnType<typeof setTimeout> | undefined;
 let stopped = false, suspended = false;
 const pause = () => {
  if (timer === undefined) return;
  clearTimeout(timer);timer = undefined;
  remaining = Math.max(0, remaining - (performance.now() - started));
 };
 const sync = () => {
  if (stopped) return;
  if (document.hidden || suspended) { pause(); return; }
  if (timer !== undefined) return;
  started = performance.now();
  timer = setTimeout(() => {
   if (document.hidden || suspended) { pause(); return; }
   timer = undefined; cancel(); callback();
  }, remaining);
 };
 const hide = () => { suspended = true; pause(); };
 const show = () => { suspended = false; sync(); };
 const cancel = () => {
  stopped = true; pause();
  document.removeEventListener("visibilitychange", sync);
  window.removeEventListener("pagehide", hide);
  window.removeEventListener("pageshow", show);
 };
 document.addEventListener("visibilitychange", sync);
 window.addEventListener("pagehide", hide);
 window.addEventListener("pageshow", show);
 sync();
 return cancel;
}
