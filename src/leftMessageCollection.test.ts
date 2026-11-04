import { describe, expect, it } from "vitest";
import { onRequest, type CollectionEnv } from "../functions/api/left-messages";
import { submittedLeftMessage } from "./leftMessageCollection";
import { sendFreeReply } from "./freeReply";
import { initialRuntime } from "./schema";
import { compileStory } from "./story-engine/compiler";
import source from "../stories/template/story.json";
const { work } = compileStory(source);
const payload = { id: "76c32601-0303-434c-b6dc-20e5a9966d46", sessionId: "7956ba07-304d-44c7-89b9-20b2415287e7", text: "我喜欢你" };
const request = (body: unknown = payload, origin = "https://zj-phone.pages.dev") => new Request("https://zj-phone.pages.dev/api/left-messages", {
  method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(body),
});
describe("private Left message collection", () => {
  it("selects only newly and successfully sent Left messages", () => {
    const before = initialRuntime(work);
    expect(submittedLeftMessage(work, before, sendFreeReply(work, before, "draft"), "A左左")).toBeUndefined();
    before.unlocked.push("interlude-love-open"); before.read.push("interlude-love-open");
    const after = sendFreeReply(work, before, "我喜欢你");
    expect(submittedLeftMessage(work, before, after, "A左左")?.body).toBe("我喜欢你");
    expect(submittedLeftMessage(work, after, after, "A左左")).toBeUndefined();
    expect(submittedLeftMessage(work, before, after, "妈咪")).toBeUndefined();
  });
  it("never collects a second reply, including after restoring the save", () => {
    const before = initialRuntime(work);
    before.unlocked.push("interlude-love-open"); before.read.push("interlude-love-open");
    const first = sendFreeReply(work, before, "你好");
    expect(submittedLeftMessage(work, before, first, "A左左")?.body).toBe("你好");
    const restored = structuredClone(first);
    expect(submittedLeftMessage(work, restored, sendFreeReply(work, restored, "我喜欢你"), "A左左")).toBeUndefined();
  });
  it("does not collect when the invitation placeholder is no longer displayed", () => {
    const before = initialRuntime(work);
    before.unlocked.push("interlude-love-open");
    before.read.push("interlude-love-open", "interlude-love-final", "interlude-zhu-2", "interlude-zhang-2");
    expect(submittedLeftMessage(work, before, sendFreeReply(work, before, "结局后留言"), "A左左")).toBeUndefined();
  });
  it("has no public read API and rejects cross-origin writes", async () => {
    expect((await onRequest({ request: new Request("https://zj-phone.pages.dev/api/left-messages"), env: {} })).status).toBe(405);
    expect((await onRequest({ request: request(payload, "https://other.example"), env: {} })).status).toBe(403);
    expect((await onRequest({ request: request(), env: {} })).status).toBe(503);
  });
  it("validates input, stores bound parameters only, and returns no collected text", async () => {
    let bound: unknown[] = [];
    const statement = { bind: (...values: unknown[]) => { bound = values; return statement; }, run: async () => ({ success: true }) };
    const env: CollectionEnv = { COLLECTION_ENABLED: "true", LEFT_MESSAGES: { prepare: () => statement } };
    expect((await onRequest({ request: request({ ...payload, text: " " }), env })).status).toBe(400);
    expect((await onRequest({ request: request({ ...payload, id: "invalid" }), env })).status).toBe(400);
    expect((await onRequest({ request: request({ ...payload, text: "x".repeat(4001) }), env })).status).toBe(400);
    expect((await onRequest({ request: request({ ...payload, text: "x".repeat(21000) }), env })).status).toBe(413);
    const response = await onRequest({ request: request(), env });
    expect(response.status).toBe(204);
    expect(bound.slice(0, 3)).toEqual([payload.id, payload.sessionId, payload.text]);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).toBe("");
  });
  it("fails closed on database errors without exposing SQL or messages", async () => {
    const env: CollectionEnv = { COLLECTION_ENABLED: "true", LEFT_MESSAGES: { prepare: () => { throw new Error("private database detail"); } } };
    const response = await onRequest({ request: request(), env });
    expect(response.status).toBe(503); expect(await response.text()).toBe("");
  });
});
