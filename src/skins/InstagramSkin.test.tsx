import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { makeItem } from "../schema";
import { InstagramSkin } from "./InstagramSkin";
import type { SkinProps } from "../AppSkins";
const props: SkinProps = {
  owner: "机主",
  name: "Instagram",
  items: [],
  creator: false,
  onRead: () => {},
  onItem: () => {},
  onAdd: () => {},
  onBack: () => {},
  thread: "",
  onThread: () => {},
};
describe("Instagram screens", () => {
  it("has only three navigation entries and never renders private messages", () => {
    const html = renderToStaticMarkup(
      <InstagramSkin
        {...props}
        items={[
          makeItem({
            id: "dm",
            folder: "私信",
            body: "do-not-render-this-message",
          }),
        ]}
        ui={{ mymyTab: "私信" }}
      />,
    );
    expect(html).toContain('data-ins-tab="主页"');
    expect(html).toContain('aria-label="主页"');
    expect(html).toContain('aria-label="Reels"');
    expect(html).toContain('aria-label="个人主页"');
    expect(html).not.toContain("do-not-render-this-message");
    expect(html).not.toContain('aria-label="私信"');
    expect(html).not.toContain('aria-label="搜索"');
  });
  it("renders six ordered Reel panels with exactly one active player", () => {
    const items = Array.from({ length: 6 }, (_, i) =>
      makeItem({
        id: `reel-${i + 1}`,
        title: `视频${i + 1}`,
        folder: "Reels",
        kind: "video",
        media: `/instagram/reels/reel-0${i + 1}.mp4`,
      }),
    );
    const html = renderToStaticMarkup(
      <InstagramSkin
        {...props}
        items={items}
        ui={{ mymyTab: "Reels", insReel: 2 }}
      />,
    );
    expect(html.match(/data-active="true"/g)).toHaveLength(1);
    expect(html.match(/class="ins-reel"/g)).toHaveLength(6);
    expect(html.indexOf("Reel 1：视频1")).toBeLessThan(
      html.indexOf("Reel 6：视频6"),
    );
    expect(html).toContain('playsInline=""');
    expect(html).toContain('muted=""');
  });
  it("uses the author's profile rather than reference screenshot identities", () => {
    const html = renderToStaticMarkup(
      <InstagramSkin {...props} ui={{ mymyTab: "个人主页" }} />,
    );
    expect(html).toContain("机主");
    expect(html).toContain("编辑个人资料");
    expect(html).not.toContain("llccwei");
    expect(html).not.toContain("430");
  });
});
