import type { Item } from "./schema";
const collator = new Intl.Collator("zh-CN", { sensitivity: "base" });
const initials = ["A阿", "B八", "C擦", "D搭", "E蛾", "F发", "G噶", "H哈", "J击", "K喀", "L垃", "M妈", "N拿", "O哦", "P啪", "Q期", "R然", "S撒", "T塌", "W挖", "X昔", "Y压", "Z匝"];
export function wechatInitial(name: string) {
  const first = name.trim()[0] || "";
  if (/^[a-z]$/i.test(first)) return first.toUpperCase();
  if (!/^[\u3400-\u9fff]$/.test(first)) return "#";
  return [...initials].reverse().find((entry) => collator.compare(first, entry[1]) >= 0)?.[0] || "A";
}
export function wechatContacts(items: Item[], owner = "") {
  const threads = [...new Set(items.filter(i => !["朋友圈", "我"].includes(i.folder) && i.kind !== "post").map(i => i.title))];
  return threads.map(name => {
    const messages = items.filter(i => i.title === name);
    const incoming = messages.find(i => !i.outgoing && i.sender !== owner && i.sender !== "我");
    return {name, thread: name, avatar: incoming?.avatar || messages.find(i => i.avatar)?.avatar || "", initial: wechatInitial(name)};
  }).sort((a,b) => a.initial === "#" && b.initial !== "#" ? 1 : b.initial === "#" && a.initial !== "#" ? -1 : a.initial.localeCompare(b.initial, "en") || collator.compare(a.name,b.name));
}
