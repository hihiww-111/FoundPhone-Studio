import { describe, it, expect } from "vitest";
import source from "../stories/template/story.json";
import { compileStory } from "./story-engine/compiler";
import { dispatch, advance, visible } from "./engine";
import { initialRuntime } from "./schema";
const { work } = compileStory(source);
const originals = work.data.notes.filter(i => i.id !== "interlude-note");
function ready() {
  let s = initialRuntime(work);
  for (const n of originals) s = dispatch(work,s,"read",n.id);
  return s;
}
function begin() {
  let s = dispatch(work,ready(),"storyConsent","interlude-note");
  s = dispatch(work,s,"read","interlude-note");
  return s;
}
describe("memo and WeChat interlude", () => {
  it("requires every existing note, including both pinned notes, and explicit consent", () => {
    let s = initialRuntime(work);
    for (const n of originals.slice(1)) s = dispatch(work,s,"read",n.id);
    expect(s.variables.noteReady).toBe(false);
    s = dispatch(work,s,"storyConsent","interlude-note");
    expect(s.unlocked).not.toContain("interlude-note");
    s = dispatch(work,s,"read",originals[0].id);
    expect(s.variables.noteReady).toBe(true);
    expect(visible(work.data.notes.find(i=>i.id==="interlude-note")!,s)).toBe(false);
  });
  it("schedules notifications at 11, 41 and 71 seconds without duplicate reads restarting them", () => {
    let s = begin();
    s = dispatch(work,s,"read","interlude-note");
    expect(s.scheduled).toHaveLength(1);
    s = advance(work,s,10999); expect(s.unlocked).not.toContain("interlude-su-1");
    s = advance(work,s,1); expect(s.unlocked).toContain("interlude-su-1");
    s = advance(work,s,29999); expect(s.unlocked).not.toContain("interlude-zhu-1");
    s = advance(work,s,1); expect(s.unlocked).toContain("interlude-zhu-1");
    s = advance(work,s,30000); expect(s.unlocked).toContain("interlude-zhang-1");
  });
  it("requires reading and manual sends, persists pending timers, and unlocks Phone only on the final send", () => {
    let s = advance(work,begin(),11000);
    s = dispatch(work,s,"send","interlude-su-1-reply");
    expect(s.unlocked).not.toContain("interlude-su-1-reply");
    for (let i=1;i<=3;i++) {
      expect(s.variables.phoneUnlocked).toBe(false);
      s=dispatch(work,s,"read",`interlude-su-${i}`);
      s=dispatch(work,s,"send",`interlude-su-${i}-reply`);
      s=dispatch(work,s,"send",`interlude-su-${i}-reply`);
      if(i<3) {
        expect(s.scheduled?.filter(t=>t.nodeId===`interlude-su-${i}-reply-delay`)).toHaveLength(1);
        s=JSON.parse(JSON.stringify(s));
        s=advance(work,s,2999); expect(s.unlocked).not.toContain(`interlude-su-${i+1}`);
        s=advance(work,s,1); expect(s.unlocked).toContain(`interlude-su-${i+1}`);
      }
    }
    expect(s.variables.phoneUnlocked).toBe(true);
  });
  it("delays the other two replies for ten seconds and records independent unread messages", () => {
    let s=advance(work,begin(),71000);
    for(const code of ["zhu","zhang"]) {
      s=dispatch(work,s,"read",`interlude-${code}-1`);
      s=dispatch(work,s,"send",`interlude-${code}-1-reply`);
    }
    s=advance(work,s,9999);
    expect(s.unlocked).not.toContain("interlude-zhu-2");
    s=advance(work,s,1);
    for(const code of ["zhu","zhang"]) {
      expect(s.unlocked).toContain(`interlude-${code}-2`);
      expect(s.read).not.toContain(`interlude-${code}-2`);
      s=dispatch(work,s,"read",`interlude-${code}-2`);
      expect(s.read).toContain(`interlude-${code}-2`);
    }
    expect(s.variables.phoneUnlocked).toBe(false);
  });
});
