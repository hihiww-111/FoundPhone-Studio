import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { makeItem } from "../schema";
import { Media } from "./shared";

describe("on-demand media", () => {
  it("does not preload audio or video in a media list", () => {
    for (const [kind, media] of [
      ["audio", "data:audio/mpeg;base64,AAAA"],
      ["video", "data:video/mp4;base64,AAAA"],
    ] as const) {
      const html = renderToStaticMarkup(<Media item={makeItem({ kind, media })} />);
      expect(html).toContain('preload="none"');
      expect(html).not.toContain("autoPlay");
    }
  });
  it("defers offscreen image downloads and decoding", () => {
    const html = renderToStaticMarkup(<Media item={makeItem({ kind: "image", media: "data:image/jpeg;base64,AAAA" })} />);
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
  });
});
