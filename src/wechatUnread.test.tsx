import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { WeChatSkin, type SkinProps } from "./AppSkins";
import { compileStory } from "./story-engine/compiler";
import { initialRuntime, makeItem } from "./schema";
import { visible } from "./engine";
import source from "../stories/template/story.json";

it("starts with no unread badges for saved history and counts only new incoming story messages", () => {
 const { work } = compileStory(source);
 const state = initialRuntime(work);
 const props: SkinProps = { owner: work.phone.owner, name: "微信", creator: false,
  interlude: true, items: work.data.wechat.filter(i => visible(i, state)),
  readIds: [], thread: "", onThread: () => {}, onRead: () => {}, onItem: () => {}, onAdd: () => {}, onBack: () => {} };
 const render = (p: SkinProps) => renderToStaticMarkup(<WeChatSkin {...p} />);
 expect(render(props)).not.toContain('class="wx-unread"');
 expect(render(props)).not.toContain('class="wx-tab-unread"');
 const incoming = makeItem({ id: "incoming-test", title: "苏新皓", meta: { interlude: "true" } });
 const next = { ...props, items: [...props.items, incoming] };
 expect(render(next)).toContain('class="wx-unread">1</b>');
 expect(render(next)).toContain('class="wx-tab-unread">1</b>');
 expect(render({ ...next, readIds: [incoming.id] })).not.toContain('class="wx-tab-unread"');
});
