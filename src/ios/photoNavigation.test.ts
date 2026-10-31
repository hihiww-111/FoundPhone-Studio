import { describe, expect, it } from "vitest";
import { makeItem } from "../schema";
import { photoSequence, photoSwipeTarget } from "./photoNavigation";

describe("photo viewer navigation", () => {
  const dog = makeItem({ id: "dog", folder: "啵啵" });
  const first = makeItem({ id: "first", folder: "最近项目" });
  const last = makeItem({ id: "last", folder: "最近项目" });
  const available = [dog, first, last];
  it("keeps the opened album order and excludes other albums", () => {
    expect(photoSequence(available, ["last", "first"]).map((i) => i.id)).toEqual(["last", "first"]);
  });
  it("keeps all library photos when opened from the library", () => {
    expect(photoSequence(available, available.map((i) => i.id))).toEqual(available);
  });
  it("ignores unavailable and duplicate IDs", () => {
    expect(photoSequence(available, ["unavailable", "first", "first"])).toEqual([first]);
  });
  it("moves left and right without wrapping at the boundaries", () => {
    expect(photoSwipeTarget(0, 3, -80, 0)).toBe(1);
    expect(photoSwipeTarget(1, 3, 80, 0)).toBe(0);
    expect(photoSwipeTarget(0, 3, 80, 0)).toBe(0);
    expect(photoSwipeTarget(2, 3, -80, 0)).toBe(2);
  });
  it("ignores taps and vertical scrolling", () => {
    expect(photoSwipeTarget(1, 3, -10, 0)).toBe(1);
    expect(photoSwipeTarget(1, 3, -40, 90)).toBe(1);
  });
});
