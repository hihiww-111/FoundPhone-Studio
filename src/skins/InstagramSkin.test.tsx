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
    expect(html).not.toContain('muted=""');
    expect(html).toContain('aria-label="静音视频"');
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

it("ignores old saved ordering and exposes fixed read-only counts without removed controls", () => {
  const order = [2, 1, 4, 3, 6, 5];
  const items = order.map((n) =>
    makeItem({
      id: `instagram-reel-${n}`,
      title: `Reel ${n}`,
      kind: "video",
      folder: "Reels",
      media: `/instagram/reels/reel-0${n}.mp4`,
    }),
  );
  const html = renderToStaticMarkup(
    <InstagramSkin
      {...props}
      items={items}
      ui={{
        mymyTab: "Reels",
        insReelOrder: [...items].reverse().map((i) => i.id),
      }}
    />,
  );
  const positions = order.map((n) =>
    html.indexOf(`/instagram/reels/reel-0${n}.mp4`),
  );
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  expect(html.match(/<small>999\+<\/small>/g)).toHaveLength(6);
  expect(html.match(/<small>99\+<\/small>/g)).toHaveLength(6);
  expect(html).not.toMatch(/<button[^>]*aria-label="评论/);
  for (const label of ["调整视频顺序", "复制视频", "视频选项", "帖子选项"])
    expect(html).not.toContain(label);
});

it("shows profile-video thumbnails only on the personal profile", () => {
  const items = [1, 2, 3].map((n) =>
    makeItem({
      id: `profile-${n}`,
      title: `主页Reel ${n}`,
      sender: "机主",
      kind: "video",
      folder: "Reels",
      media: `/instagram/profile-reels/reel-0${n}.mp4`,
      meta: {
        profileReel: "true",
        owner: "true",
        cover: `/instagram/profile-reels/reel-0${n}.jpg`,
      },
    }),
  );
  items.push(
    makeItem({
      id: "profile-info",
      avatar: "/instagram/avatar.jpg",
      meta: {
        profile: "true",
        username: "Notbobo",
        followers: "333",
        following: "0",
      },
    }),
  );
  const home = renderToStaticMarkup(<InstagramSkin {...props} items={items} />);
  expect(home).not.toContain('aria-label="查看主页Reel');
  expect(home).not.toContain("<video");
  const html = renderToStaticMarkup(
    <InstagramSkin {...props} items={items} ui={{ mymyTab: "个人主页" }} />,
  );
  expect(html.match(/aria-label="查看主页Reel [123]"/g)).toHaveLength(3);
  expect(html).toContain("Notbobo");
  expect(html).toContain("<b>333</b>粉丝");
  expect(html).toContain("<b>0</b>关注");
  expect(html).toContain('src="/instagram/avatar.jpg"');
  expect(html).not.toContain("发现用户");
  expect(html).not.toContain('aria-label="新建内容"');
  expect(html).not.toContain('class="ins-highlights"');
  expect(html).not.toContain("<video");
});
