import { describe, expect, it } from "vitest";
import { makeItem, safeMedia } from "../schema";
import {
  instagramContent,
  instagramReelStats,
  reelSwipeTarget,
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

describe("Reels swipe paging", () => {
  it("moves up to the next video and down to the previous, one at a time", () => {
    expect(reelSwipeTarget(1, 6, 3, -240)).toBe(2);
    expect(reelSwipeTarget(2, 6, 0, 180)).toBe(1);
    expect(reelSwipeTarget(5, 6, 0, -180)).toBe(5);
    expect(reelSwipeTarget(0, 6, 0, 180)).toBe(0);
  });
  it("does not change videos for taps, short movements or horizontal gestures", () => {
    expect(reelSwipeTarget(2, 6, 1, -10)).toBe(2);
    expect(reelSwipeTarget(2, 6, 160, -50)).toBe(2);
  });
});

describe("Profile Reels", () => {
  it("keeps posted videos in the profile without adding them to the six-video stream", () => {
    const feed = makeItem({ id: "feed", kind: "video", folder: "Reels" });
    const profile = makeItem({
      id: "profile",
      sender: "机主",
      kind: "video",
      folder: "Reels",
      meta: { profileReel: "true", owner: "true" },
    });
    const content = instagramContent([feed, profile], "机主");
    expect(content.reels.map((i) => i.id)).toEqual(["feed"]);
    expect(content.profileReels.map((i) => i.id)).toEqual(["profile"]);
    expect(content.ownReels.map((i) => i.id)).toEqual(["profile"]);
    expect(content.posts).toHaveLength(0);
  });
  it("enables exact authored counts and comments only for the new profile videos", () => {
    const profile = makeItem({
      likes: 123,
      comments: ["甲：一", "乙：二"],
      meta: { profileReel: "true" },
    });
    expect(instagramReelStats(profile)).toEqual({
      likes: "123",
      comments: "2",
      commentsEnabled: true,
    });
    expect(instagramReelStats(makeItem({ likes: 123 }))).toEqual({
      likes: "999+",
      comments: "99+",
      commentsEnabled: false,
    });
  });
});
