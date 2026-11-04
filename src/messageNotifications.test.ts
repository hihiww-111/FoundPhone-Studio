import { expect, it } from "vitest";
import { makeItem } from "./schema";
import { queueMessageNotifications } from "./messageNotifications";
it("queues every outside-chat arrival and never re-notifies messages received in the open chat", () => {
 const seen = new Set<string>();
 const left = makeItem({id:"left",title:"A左左"});
 const su = makeItem({id:"su",title:"苏新皓"});
 expect(queueMessageNotifications([], [left,su],seen,"A左左")).toEqual([su]);
 seen.add(left.id);seen.add(su.id);
 expect(queueMessageNotifications([], [left,su],seen,"")).toEqual([]);
 const next = [makeItem({id:"next-1",title:"A左左"}),makeItem({id:"next-2",title:"苏新皓"})];
 expect(queueMessageNotifications([],next,seen,"")).toEqual(next);
});
