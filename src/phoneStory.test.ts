import { describe, it, expect } from "vitest";
import source from "../stories/template/story.json";
import { compileStory } from "./story-engine/compiler";
import { advance, dispatch, visible } from "./engine";
import { initialRuntime } from "./schema";
import {
  CAT_CONTACT,
  callRecords,
  endPhoneCall,
  firstContactGlyph,
  resumePhoneStory,
  phoneIsUnlocked,
  startPhoneCall,
} from "./phoneCalls";
import { draftSequence } from "./draftSequence";
const { work } = compileStory(source);
function callable() {
  const s = initialRuntime(work);
  s.variables.phoneUnlocked = true;
  s.unlocked = ["interlude-su-3-reply"];
  s.completed = ["interlude-su-3-reply-send"];
  return s;
}
function firstMessage() {
  let s = startPhoneCall(work, callable(), CAT_CONTACT, "call-1");
  s = advance(work, s, 6000);
  s = endPhoneCall(work, s, true);
  return advance(work, s, 3000);
}
describe("Phone continuation", () => {
  it("keeps Phone gated, removes test calls, and preserves the full emoji avatar", () => {
    const s = initialRuntime(work);
    expect(startPhoneCall(work, s, CAT_CONTACT, "blocked")).toBe(s);
    expect(
      work.data.phone.filter((i) => i.folder === "通讯录").map((i) => i.title),
    ).toEqual([CAT_CONTACT, "妈咪", "苏新皓", "张峻豪", "张泽禹", "朱志鑫"]);
    expect(work.data.phone.some((i) => i.id.startsWith("test-"))).toBe(false);
    expect(firstContactGlyph(CAT_CONTACT)).toBe("🐈‍⬛");
    expect(firstContactGlyph("张泽禹")).toBe("张");
  });
  it("ends the first cat call at six seconds and delivers the message three seconds later", () => {
    let s = startPhoneCall(work, callable(), CAT_CONTACT, "first");
    s = advance(work, s, 5999);
    expect(s.variables.firstCatCallEnded).toBe(false);
    expect(s.unlocked).not.toContain("interlude-call-zuo-1");
    s = advance(work, s, 1);
    expect(s.variables.firstCatCallEnded).toBe(true);
    s = endPhoneCall(work, s, true);
    expect(callRecords(s)[0].status).toBe("对方已挂断");
    expect(s.ui?.phone?.activeName).toBe("");
    s = advance(work, s, 2999);
    expect(s.unlocked).not.toContain("interlude-call-zuo-1");
    s = advance(work, s, 1);
    expect(s.unlocked).toContain("interlude-call-zuo-1");
  });
  it("cancels an early hangup without advancing, and a retry receives a fresh six-second wait", () => {
    let s = startPhoneCall(work, callable(), CAT_CONTACT, "cancelled");
    s = advance(work, s, 3000);
    s = endPhoneCall(work, s);
    expect(callRecords(s)[0].status).toBe("已取消");
    expect(s.scheduled).not.toContainEqual(
      expect.objectContaining({ nodeId: "phone-cat-end" }),
    );
    s = advance(work, s, 10000);
    expect(s.variables.firstCatCallEnded).toBe(false);
    expect(s.unlocked).not.toContain("interlude-call-zuo-1");
    s = startPhoneCall(work, s, CAT_CONTACT, "retry");
    s = advance(work, s, 5999);
    expect(s.variables.firstCatCallEnded).toBe(false);
    s = advance(work, s, 1);
    expect(s.variables.firstCatCallEnded).toBe(true);
  });
  it("records other calls and repeats without retriggering the first-call story", () => {
    let s = firstMessage();
    s = startPhoneCall(work, s, CAT_CONTACT, "again");
    expect(s.ui?.phone?.firstAttempt).toBe(false);
    s = advance(work, s, 10000);
    expect(s.ui?.phone?.activeName).toBe(CAT_CONTACT);
    s = endPhoneCall(work, s);
    s = startPhoneCall(work, s, "妈咪", "mom-call");
    expect(callRecords(s)[0].name).toBe("妈咪");
    expect(s.ui?.phone?.activeName).toBe("妈咪");
  });
  it("never skips reading, draft completion, consent, or the two-second blackout", () => {
    let s = initialRuntime(work);
    s = dispatch(work, s, "meetConsent", "left");
    s = dispatch(work, s, "draftComplete", "call-unsent-draft");
    s = advance(work, s, 100000);
    expect(s.unlocked).not.toContain("interlude-happy-note");
    s = firstMessage();
    s = dispatch(work, s, "draftComplete", "call-unsent-draft");
    expect(
      s.scheduled?.some((t) => t.nodeId === "phone-meet-message-delay"),
    ).toBe(false);
    s = dispatch(work, s, "read", "interlude-call-zuo-1");
    s = dispatch(work, s, "send", "call-unsent-draft");
    expect(s.unlocked).not.toContain("call-unsent-draft");
    s = dispatch(work, s, "draftComplete", "call-unsent-draft");
    s = advance(work, s, 1999);
    expect(s.variables.meetReady).toBe(false);
    s = advance(work, s, 1);
    expect(s.unlocked).toContain("interlude-call-zuo-2");
    expect(s.variables.meetReady).toBe(false);
    s = advance(work, s, 1999);
    expect(s.variables.meetReady).toBe(false);
    s = advance(work, s, 1);
    expect(s.variables.meetReady).toBe(true);
    s = advance(work, s, 10000);
    expect(s.unlocked).not.toContain("interlude-happy-note");
    s = dispatch(work, s, "meetConsent", "left");
    expect(s.variables.meetBlackout).toBe(true);
    s = advance(work, s, 1999);
    expect(s.variables.meetBlackout).toBe(true);
    s = advance(work, s, 1);
    expect(s.variables.meetBlackout).toBe(false);
    s = dispatch(work, s, "read", "interlude-happy-note");
    s = advance(work, s, 19999);
    expect(s.variables.finalNoteExitReady).toBe(false);
    s = advance(work, s, 1);
    expect(s.variables.finalNoteExitReady).toBe(true);
    s = advance(work, s, 19999);
    expect(s.unlocked).not.toContain("interlude-call-zuo-3");
    s = advance(work, s, 1);
    expect(s.unlocked).toContain("interlude-call-zuo-3");
    expect(s.read).not.toContain("interlude-call-zuo-3");
    expect(
      visible(
        work.data.notes.find((i) => i.id === "interlude-happy-note")!,
        s,
      ),
    ).toBe(true);
    expect(
      work.data.notes.find((i) => i.id === "interlude-happy-note")?.time,
    ).toBe("刚刚");
  });
  it("types the first draft, erases it character by character, and only then types the second", () => {
    const first = "我有话对你说",
      second = "左航，我们可以聊一聊吗";
    const frames = draftSequence(second, first).map((f) => f.text);
    expect(frames.slice(0, 6)).toEqual([
      "我",
      "我有",
      "我有话",
      "我有话对",
      "我有话对你",
      first,
    ]);
    expect(frames.slice(6, 12)).toEqual([
      "我有话对你",
      "我有话对",
      "我有话",
      "我有",
      "我",
      "",
    ]);
    expect(frames[12]).toBe("左");
    expect(frames.at(-1)).toBe(second);
  });
  it("resets old narrative progress and timers while retaining Instagram preferences", () => {
    const saved = callable();
    saved.revision = 44;
    saved.read = ["interlude-note"];
    saved.scheduled = [{ nodeId: "interlude-su-delay", due: 100 }];
    saved.ui = { instagram: { displayName: "404NOTFound" }, phone: { activeName: "妈咪" } };
    const restored = resumePhoneStory(work, saved)!;
    expect(phoneIsUnlocked(restored)).toBe(false);
    expect(restored.read).toEqual([]);
    expect(restored.unlocked).not.toContain("interlude-note");
    expect(restored.scheduled).not.toContainEqual(saved.scheduled[0]);
    expect(restored.ui?.instagram).toEqual(saved.ui.instagram);
    expect(restored.ui?.phone).toBeUndefined();
    expect(restored.variables.noteReady).toBe(false);
  });
  it("migrates revision 45 timers without resetting valid progress", () => {
    const saved = callable();
    saved.revision = 45;
    saved.elapsedMs = 10000;
    saved.scheduled = [{nodeId:"interlude-zhu-delay", due:30000}];
    const restored = resumePhoneStory(work, saved)!;
    expect(phoneIsUnlocked(restored)).toBe(true);
    expect(restored.revision).toBe(work.updatedAt);
    expect(restored.scheduled).toEqual([{nodeId:"interlude-zhu-delay",due:25000}]);
  });
  it("resumes compatible progress but refuses a forged phone flag", () => {
    const saved = callable();
    expect(resumePhoneStory(work, saved)).toBe(saved);
    saved.completed = [];
    expect(phoneIsUnlocked(saved)).toBe(false);
    expect(startPhoneCall(work, saved, CAT_CONTACT, "blocked")).toBe(saved);
    expect(resumePhoneStory(work, saved)?.variables.phoneUnlocked).toBe(false);
  });
});

describe("other first calls and repeat calls", () => {
  const cases = [
    ["mom", "妈咪", 3000, "怎么啦宝贝？"],
    ["su", "苏新皓", 2000, "咋啦咋啦找我干啥？"],
    ["zhixin", "朱志鑫", 2000, "？"],
    ["zeyu", "张泽禹", 2000, "同在一个屋檐下还要浪费话费？"],
    ["junhao", "张峻豪", 2000, "咋了bro说话！"],
  ] as const;
  it.each(cases)(
    "first %s call times out at 8 seconds and sends one message",
    (code, name, delay, text) => {
      let s = startPhoneCall(work, callable(), name, "first-" + code);
      s = advance(work, s, 7999);
      expect(s.variables["phoneAutoEnded-" + code]).toBe(false);
      s = advance(work, s, 1);
      expect(s.variables["phoneAutoEnded-" + code]).toBe(true);
      s = endPhoneCall(work, s, true);
      s = advance(work, s, delay - 1);
      expect(s.unlocked).not.toContain("interlude-phone-" + code);
      s = advance(work, s, 1);
      expect(s.unlocked).toContain("interlude-phone-" + code);
      expect(
        work.data.wechat.find((i) => i.id === "interlude-phone-" + code)?.body,
      ).toBe(text);
      expect(s.read).not.toContain("interlude-phone-" + code);
    },
  );
  it.each(cases)(
    "manually ending %s also delivers once and later calls wait 30 seconds",
    (code, name, delay) => {
      let s = startPhoneCall(work, callable(), name, "manual-" + code);
      s = advance(work, s, 1000);
      s = endPhoneCall(work, s);
      expect(s.variables["phoneFirstEnded-" + code]).toBe(true);
      expect(s.scheduled?.some((t) => t.nodeId === "phone-auto-" + code)).toBe(
        false,
      );
      s = advance(work, s, delay);
      expect(s.unlocked).toContain("interlude-phone-" + code);
      s = startPhoneCall(work, s, name, "repeat-" + code);
      expect(s.ui?.phone?.firstAttempt).toBe(false);
      s = advance(work, s, 29999);
      expect(s.variables.phoneRepeatExpired).toBe(false);
      s = advance(work, s, 1);
      expect(s.variables.phoneRepeatExpired).toBe(true);
      s = endPhoneCall(work, s, true);
      expect(callRecords(s)[0].status).toBe("对方已挂断");
      expect(
        s.unlocked.filter((id) => id === "interlude-phone-" + code),
      ).toHaveLength(1);
    },
  );
});
