import { expect, it } from "vitest";
import { initialRuntime } from "./schema";
import { compileStory } from "./story-engine/compiler";
import source from "../stories/template/story.json";
import { readVisitSave, writeVisitSave } from "./visitSave";
const storage = () => {
 const data = new Map<string, string>();
 return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); }, removeItem: (k: string) => { data.delete(k); } };
};
it("resumes only on reload and clears progress on a new URL visit", () => {
 const { work } = compileStory(source);
 const saved = initialRuntime(work);
 saved.read.push("notes-2026-04-12");
 saved.variables.phoneUnlocked = true;
 const tab = storage();
 writeVisitSave(work.id, saved, tab);
 expect(readVisitSave(work.id, "reload", tab)?.state).toEqual(saved);
 expect(readVisitSave(work.id, "navigate", tab)).toBeUndefined();
 expect(readVisitSave(work.id, "reload", tab)).toBeUndefined();
});
it("keeps tab saves independent even if a new tab initially copied the old save", () => {
 const { work } = compileStory(source);
 const saved = initialRuntime(work);saved.read.push("a-note");
 const first = storage(), second = storage();
 writeVisitSave(work.id, saved, first);writeVisitSave(work.id, saved, second);
 expect(readVisitSave(work.id, "navigate", second)).toBeUndefined();
 expect(readVisitSave(work.id, "reload", first)?.state.read).toContain("a-note");
});
