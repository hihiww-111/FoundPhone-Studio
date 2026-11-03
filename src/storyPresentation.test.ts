import { describe,it,expect } from "vitest";
import source from "../stories/template/story.json";
import { compileStory } from "./story-engine/compiler";
import { initialRuntime,makeItem } from "./schema";
import { dispatch,advance,visible } from "./engine";
import { loveRevealed,storyWallpaper,momentsPosts } from "./storyPresentation";
import { resumePhoneStory } from "./phoneCalls";
import { libraryPhotos } from "./ios/photoNavigation";
const {work}=compileStory(source);
describe("Moments and love reveal",()=>{
 it("keeps three new home posts before four saved posts",()=>{
  expect(work.data.redbook).toHaveLength(7);
  expect(work.data.redbook.slice(0,3).map(i=>i.title)).toEqual(["我猪到了呀！","个人攀冰装备分享","一些大大方方表白的小tips"]);
  expect(work.data.redbook.filter(i=>i.favorite || i.folder==="收藏")).toHaveLength(4);
  expect(work.data.redbook[0].meta.images.split("|")).toHaveLength(3);
 });
 it("shows six original posts in reverse order before revealing the final two",()=>{
  let s=initialRuntime(work);
  const posts=()=>momentsPosts(work.data.wechat.filter(i=>visible(i,s)));
  expect(posts().map(i=>i.id)).toEqual([6,5,4,3,2,1].map(n=>`wechat-moment-0${n}`));
  expect(loveRevealed(s)).toBe(false);
  expect(storyWallpaper(s,true)).toBe("/wallpapers/before-love.jpg");
  expect(storyWallpaper(s,false)).toBe("/wallpapers/before-love.jpg");
  s.unlocked.push("interlude-secret");
  s=dispatch(work,s,"read","interlude-secret");
  s=dispatch(work,s,"send","interlude-lovers-reply");
  s=advance(work,s,2999);
  expect(posts()).toHaveLength(6);
  s=advance(work,s,1);
  expect(posts().slice(0,2).map(i=>i.body)).toEqual(["你好","💖With L"]);
  expect(loveRevealed(s)).toBe(true);
  expect(storyWallpaper(s,true)).toBe("/wallpapers/lock.jpg");
  expect(storyWallpaper(s,false)).toBe("/wallpapers/home.jpg");
 });
 it("keeps correct artwork, authors, likes and comments without creating chat contacts",()=>{
  const posts=momentsPosts(work.data.wechat);
  expect(posts).toHaveLength(8);
  expect(posts.every(i=>!!i.sender && !!i.avatar && i.folder==="朋友圈")).toBe(true);
  expect(posts.at(-1)?.media).toBe("/wechat/moments/photo-05.jpg");
  const third=posts.find(i=>i.id==="wechat-moment-03")!;
  expect(third.media).toBe("");expect(third.meta.likes).toBe("");expect(third.comments).toHaveLength(2);
 });
 it("restores the reveal in compatible old saves and keeps hidden-album photos out of the library",()=>{
  const s=initialRuntime(work);s.revision=48;s.unlocked.push("interlude-love-open");
  const restored=resumePhoneStory(work,s)!;
  expect(restored.unlocked).toContain("wechat-moment-07");
  expect(restored.unlocked).toContain("wechat-moment-08");
  expect(libraryPhotos([makeItem({folder:"已隐藏"})])).toEqual([]);
  const hidden=work.data.photos.filter(i=>i.folder==="已隐藏");
  expect(hidden).toHaveLength(2);
  expect(libraryPhotos(work.data.photos).some(i=>hidden.some(h=>h.id===i.id))).toBe(false);
 });
});
