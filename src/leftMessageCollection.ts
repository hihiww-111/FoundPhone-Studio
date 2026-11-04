import type { Runtime, Work } from "./schema";

export function submittedLeftMessage(work: Work, before: Runtime, after: Runtime, thread: string) {
  if (work.id !== "phone-a-story" || thread !== "A左左" || before === after) return undefined;
  const oldIds = new Set((before.messages.wechat ?? []).map(item => item.id));
  return (after.messages.wechat ?? []).find(item => !oldIds.has(item.id) && item.outgoing && item.title === "A左左");
}

/** Called only after a successful manual send; drafts and other chats never reach this function. */
export function collectLeftMessage(id: string, text: string): void {
  if (text.length > 4000) return;
  let sessionId: string;
  try {
    sessionId = sessionStorage.getItem("left-message-visit") || crypto.randomUUID();
    sessionStorage.setItem("left-message-visit", sessionId);
  } catch { sessionId = crypto.randomUUID(); }
  const body = JSON.stringify({ id, sessionId, text });
  const deliver = async (attempt: number): Promise<void> => {
    try {
      const response = await fetch("/api/left-messages", {
        method: "POST", headers: { "Content-Type": "application/json" }, body,
        credentials: "omit", keepalive: true,
      });
      if (response.ok || response.status < 500) return;
    } catch { /* Collection failure must never block the fictional conversation. */ }
    if (attempt < 2) window.setTimeout(() => { void deliver(attempt + 1); }, 1500 * (attempt + 1));
  };
  void deliver(0);
}
