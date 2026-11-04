import { expect, it } from "vitest";
import { usesNativeKeyboard } from "./nativeKeyboard";
it("uses the system keyboard on phones and touch tablets and retains the embedded desktop keyboard", () => {
 expect(usesNativeKeyboard({ maxTouchPoints:5, userAgent:"iPhone" })).toBe(true);
 expect(usesNativeKeyboard({ maxTouchPoints:5, userAgent:"Macintosh" })).toBe(true);
 expect(usesNativeKeyboard({ maxTouchPoints:0, userAgent:"Android" })).toBe(true);
 expect(usesNativeKeyboard({ maxTouchPoints:0, userAgent:"Macintosh" })).toBe(false);
});
