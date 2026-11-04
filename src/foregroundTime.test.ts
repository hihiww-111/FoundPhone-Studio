import { afterEach, expect, it, vi } from "vitest";
import { ForegroundClock, foregroundTimeout } from "./foregroundTime";
afterEach(() => { vi.useRealTimers();vi.unstubAllGlobals(); });
it("excludes time in hidden tabs while retaining the elapsed part before hiding", () => {
 const clock = new ForegroundClock(0,true);
 expect(clock.consume(2000)).toBe(2000);
 expect(clock.visibility(false,3000)).toBe(1000);
 expect(clock.consume(100000)).toBe(0);
 expect(clock.visibility(true,200000)).toBe(0);
 expect(clock.consume(201000)).toBe(1000);
});
it("pauses an in-progress timeout and continues its remaining duration after returning", () => {
 vi.useFakeTimers({toFake:["setTimeout","clearTimeout","performance"]});
 const doc=Object.assign(new EventTarget(),{hidden:false});
 const win=new EventTarget();vi.stubGlobal("document",doc);vi.stubGlobal("window",win);
 const callback=vi.fn();foregroundTimeout(callback,4000);
 vi.advanceTimersByTime(1000);doc.hidden=true;doc.dispatchEvent(new Event("visibilitychange"));
 vi.advanceTimersByTime(60000);expect(callback).not.toHaveBeenCalled();
 doc.hidden=false;doc.dispatchEvent(new Event("visibilitychange"));
 vi.advanceTimersByTime(2999);expect(callback).not.toHaveBeenCalled();
 vi.advanceTimersByTime(1);expect(callback).toHaveBeenCalledTimes(1);
});
it("pauses on pagehide and cancels timers cleanly", () => {
 vi.useFakeTimers({toFake:["setTimeout","clearTimeout","performance"]});
 const doc=Object.assign(new EventTarget(),{hidden:false});const win=new EventTarget();
 vi.stubGlobal("document",doc);vi.stubGlobal("window",win);
 const callback=vi.fn();const cancel=foregroundTimeout(callback,2000);
 vi.advanceTimersByTime(500);win.dispatchEvent(new Event("pagehide"));
 vi.advanceTimersByTime(10000);expect(callback).not.toHaveBeenCalled();
 win.dispatchEvent(new Event("pageshow"));vi.advanceTimersByTime(1499);expect(callback).not.toHaveBeenCalled();
 cancel();vi.advanceTimersByTime(10000);expect(callback).not.toHaveBeenCalled();
});
