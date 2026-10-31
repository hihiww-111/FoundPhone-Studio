import { describe, expect, it } from "vitest";
import { edgeViewport } from "./viewport";

describe("edge-to-edge player viewport", () => {
  for (const [width, height] of [[393, 740], [375, 550], [430, 840], [844, 340]]) {
    it(`fills ${width}×${height} without stretching`, () => {
      const view = edgeViewport(width, height);
      expect(view.width * view.scale).toBeCloseTo(width);
      expect(view.height * view.scale).toBeCloseTo(height);
      expect(view.width).toBeGreaterThanOrEqual(393 - 1e-6);
      expect(view.height).toBeGreaterThanOrEqual(500 - 1e-6);
    });
  }
});
