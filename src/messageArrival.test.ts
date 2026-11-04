import { expect, it } from "vitest";
import { compileStory } from "./story-engine/compiler";
import { initialRuntime } from "./schema";
import source from "../stories/template/story.json";
import { messageArrivalTime, stampMessageArrivals } from "./messageArrival";
it("records local arrival date and time once for Left and every call side message", () => {
 const { work } = compileStory(source);
 let state = initialRuntime(work);
 const ids = ["interlude-call-zuo-3", ...["mom", "su", "zhixin", "zeyu", "junhao"].map(id => `interlude-phone-${id}`)];
 expect(stampMessageArrivals(work, state)).toBe(state);
 state.unlocked.push(...ids);
 state = stampMessageArrivals(work, state, new Date(2026, 10, 4, 18, 7));
 for (const id of ids) {
  const item = work.data.wechat.find(i => i.id === id)!;
  expect(messageArrivalTime(item, state).time).toBe("2026-11-04 18:07");
  expect(item.time).toBe("");
 }
 expect(stampMessageArrivals(work, state, new Date(2026, 10, 5, 8, 0))).toBe(state);
 const saved = JSON.parse(JSON.stringify(state));
 expect(messageArrivalTime(work.data.wechat.find(i => i.id === ids[0])!, saved).time).toBe("2026-11-04 18:07");
});
