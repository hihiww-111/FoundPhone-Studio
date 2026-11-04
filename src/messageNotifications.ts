import type { Item } from "./schema";
export function queueMessageNotifications(queue: Item[], messages: Item[], seen: Set<string>, activeThread: string): Item[] {
 const fresh = messages.filter(item => !seen.has(item.id));
 return [...queue.filter(item => item.title !== activeThread && messages.some(unread => unread.id === item.id)), ...fresh.filter(item => item.title !== activeThread)];
}
