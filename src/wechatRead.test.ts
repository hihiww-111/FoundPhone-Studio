import { describe, expect, it } from "vitest";
import source from "../stories/template/story.json";
import { compileStory } from "./story-engine/compiler";
import { initialRuntime, makeItem } from "./schema";
import { readWechatThread } from "./wechatRead";

describe("WeChat conversation read state", () => {
  it("clears all six opened messages without reading another chat or future messages", () => {
    const { work } = compileStory(source);
    work.mode = "explore";
    const messages = Array.from({ length: 6 }, (_, i) => makeItem({ id: `new-${i}`, title: "test-chat", meta: { interlude: "true" } }));
    work.data.wechat = [...messages,
      makeItem({ id: "other", title: "other-chat" }),
      makeItem({ id: "future", title: "test-chat", hidden: true }),
      makeItem({ id: "sent", title: "test-chat", outgoing: true })];
    const state = initialRuntime(work);
    const read = readWechatThread(work, state, "test-chat");
    expect(read.read).toEqual(messages.map(item => item.id));
    expect(state.read).toEqual([]);
    expect(readWechatThread(work, read, "test-chat")).toBe(read);
    read.messages.wechat = [makeItem({ id: "arrived", title: "test-chat" })];
    expect(readWechatThread(work, read, "test-chat").read).toContain("arrived");
  });
});
