import { expect, it } from "vitest";
import dictionary from "./vendor/pinyin/dictionary.json";
import { pinyinCandidates } from "./pinyinInput";
it("converts offline pinyin and leaves unmatched syllables for the next selection", () => {
 expect(pinyinCandidates(dictionary, "nihao")[0]).toEqual({word:"你好",consumed:5});
 expect(pinyinCandidates(dictionary, "woaini")[0].word).toBe("我爱你");
 expect(pinyinCandidates(dictionary, "nihaozzzz")[0].consumed).toBe(5);
});
