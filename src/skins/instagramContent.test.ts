import { describe, expect, it } from "vitest";
import { makeItem, safeMedia } from "../schema";
import {
  instagramContent,
  orderedInstagramReels,
  moveInstagramReel,
  instagramImages,
  instagramTab,
} from "./instagramContent";

describe("Instagram content and navigation", () => {
  it("restores old private-message/search saves to Home", () => {
    expect(instagramTab("私信")).toBe("主页");
    expect(instagramTab("搜索")).toBe("主页");
    expect(instagramTab("Reels")).toBe("Reels");
    expect(instagramTab("个人主页")).toBe("个人主页");
  });
  it("never exposes authored DMs in feed, stories, reels or profile", () => {
    const dm = makeItem({
      id: "dm",
      folder: "私信",
      sender: "机主",
      kind: "video",
      meta: { story: "true", reel: "true" },
    });
    const result = instagramContent([dm], "机主");
    expect(Object.values(result).every((items) => items.length === 0)).toBe(
      true,
    );
  });
  it("keeps six reels in authored order, separate from stories and feed", () => {
    const reels = Array.from({ length: 6 }, (_, i) =>
      makeItem({
        id: `reel-${i + 1}`,
        folder: "Reels",
        kind: "video",
        sender: "机主",
      }),
    );
    const story = makeItem({
      id: "story",
      kind: "video",
      meta: { story: "true" },
    });
    const post = makeItem({ id: "post", sender: "朋友" });
    const result = instagramContent([post, ...reels, story], "机主");
    expect(result.reels.map((i) => i.id)).toEqual(reels.map((i) => i.id));
    expect(result.posts.map((i) => i.id)).toEqual(["post"]);
    expect(result.stories.map((i) => i.id)).toEqual(["story"]);
    expect(result.ownPosts).toEqual([]);
    expect(result.ownReels).toHaveLength(6);
  });
  it("shows only the owner's posts on their profile", () => {
    const mine = makeItem({ id: "mine", sender: "张极" });
    const other = makeItem({ id: "other", sender: "朋友" });
    expect(
      instagramContent([mine, other], "张极").ownPosts.map((i) => i.id),
    ).toEqual(["mine"]);
  });
  it("allows only the six local reel slots, with no arbitrary URLs or paths", () => {
    for (let i = 1; i <= 6; i++)
      expect(safeMedia(`/instagram/reels/reel-0${i}.mp4`)).toBe(
        `/instagram/reels/reel-0${i}.mp4`,
      );
    for (const path of [
      "/instagram/reels/reel-07.mp4",
      "/instagram/reels/../private.mp4",
      "https://example.com/video.mp4",
      "javascript:alert(1)",
    ])
      expect(safeMedia(path)).toBe("");
  });
  it("filters unsafe carousel URLs and handles malformed metadata", () => {
    const image = "/photos/bobo/bobo-01.jpg";
    expect(
      instagramImages(
        makeItem({ kind: "image", media: image, meta: { images: "invalid" } }),
      ),
    ).toEqual([image]);
    expect(
      instagramImages(
        makeItem({
          meta: {
            images: JSON.stringify([
              image,
              "javascript:alert(1)",
              "https://example.com/a.jpg",
            ]),
          },
        }),
      ),
    ).toEqual([image]);
  });
});

describe("Reels custom order", () => {
  it("keeps a saved order, drops removed IDs and appends new videos once", () => {
    const items = ["a", "b", "c"].map((id) => makeItem({ id }));
    expect(
      orderedInstagramReels(items, ["b", "missing", "b", "a"]).map((i) => i.id),
    ).toEqual(["b", "a", "c"]);
  });
  it("moves a reel in either direction without losing or mutating items", () => {
    const ids = ["a", "b", "c", "d"];
    expect(moveInstagramReel(ids, "c", 0)).toEqual(["c", "a", "b", "d"]);
    expect(moveInstagramReel(ids, "a", 3)).toEqual(["b", "c", "d", "a"]);
    expect(moveInstagramReel(ids, "missing", 2)).toEqual(ids);
    expect(ids).toEqual(["a", "b", "c", "d"]);
  });
});
