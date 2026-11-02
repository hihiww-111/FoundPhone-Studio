import { describe, expect, it } from "vitest";
import { makeItem } from "./schema";
import { wechatContacts, wechatInitial } from "./wechatContacts";
describe("WeChat address book",()=>{
 it("uses conversation remarks and incoming avatar, without making the owner a contact",()=>{
  const a=makeItem({title:"左左",sender:"张极",outgoing:true,avatar:"owner"});
  const b=makeItem({title:"左左",sender:"左航",avatar:"friend"});
  const c=makeItem({title:"朋友圈",folder:"朋友圈",kind:"post"});
  expect(wechatContacts([a,b,c],"张极")).toEqual([{name:"左左",thread:"左左",avatar:"friend",initial:"Z"}]);
 });
 it("groups Chinese remarks and Latin names with nonalphabetic names last",()=>{
  expect(["阿航","綦江","张三","JI","123"].map(wechatInitial)).toEqual(["A","Q","Z","J","#"]);
 });
});
