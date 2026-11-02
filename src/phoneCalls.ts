import { dispatch } from "./engine";
import type { Runtime, Work } from "./schema";
export type CallRecord = {
  id: string;
  name: string;
  time: string;
  status: "正在呼叫" | "已取消" | "对方已挂断";
};
export const CAT_CONTACT = "🐈‍⬛（不过敏版）";
export function callRecords(state: Runtime): CallRecord[] {
  const rows = state.ui?.phone?.callRecords;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    try {
      const r = JSON.parse(row) as CallRecord;
      return typeof r.id === "string" &&
        typeof r.name === "string" &&
        typeof r.time === "string" &&
        ["正在呼叫", "已取消", "对方已挂断"].includes(r.status)
        ? [r]
        : [];
    } catch {
      return [];
    }
  });
}
export function startPhoneCall(
  work: Work,
  state: Runtime,
  name: string,
  id: string,
): Runtime {
  if (!state.variables.phoneUnlocked || state.ui?.phone?.activeName)
    return state;
  const record: CallRecord = { id, name, time: state.time, status: "正在呼叫" };
  const code =
    work.data.phone?.find((i) => i.title === name)?.meta.contactId || "number";
  const first =
    code === "cat"
      ? !state.variables.firstCatCallEnded
      : code !== "number" && !state.variables["phoneFirstEnded-" + code];
  const next = {
    ...state,
    ui: {
      ...state.ui,
      phone: {
        ...state.ui?.phone,
        activeName: name,
        activeId: id,
        activeContactId: code,
        firstAttempt: first,
        callRecords: [
          JSON.stringify(record),
          ...(Array.isArray(state.ui?.phone?.callRecords)
            ? state.ui.phone.callRecords
            : []),
        ],
      },
    },
  };
  return dispatch(work, next, "phoneDial", first ? code : "repeat");
}

export function endPhoneCall(
  work: Work,
  state: Runtime,
  remote = false,
): Runtime {
  const phone = state.ui?.phone;
  if (!phone?.activeName) return state;
  const next = structuredClone(state);
  next.ui!.phone = {
    ...phone,
    activeName: "",
    activeId: "",
    firstAttempt: false,
    callRecords: callRecords(state).map((r) =>
      JSON.stringify(
        r.id === phone.activeId
          ? { ...r, status: remote ? "对方已挂断" : "已取消" }
          : r,
      ),
    ),
  };
  if (
    !remote &&
    phone.activeName === CAT_CONTACT &&
    !state.variables.firstCatCallEnded
  ) {
    next.variables.catCallRinging = false;
    next.scheduled = next.scheduled?.filter(
      (t) => t.nodeId !== "phone-cat-end",
    );
  }
  next.scheduled = next.scheduled?.filter(
    (t) =>
      t.nodeId !== "phone-repeat-end" &&
      t.nodeId !== "phone-auto-" + phone.activeContactId,
  );
  return phone.firstAttempt && phone.activeContactId !== "cat"
    ? dispatch(work, next, "phoneEnded", String(phone.activeContactId))
    : next;
}
/** Additive story revisions explicitly opt into retaining the previous progress. */
export function resumePhoneStory(
  work: Work,
  saved: Runtime,
): Runtime | undefined {
  if (saved.revision === work.updatedAt) return saved;
  if (
    work.id !== "phone-a-story" ||
    saved.revision !== work.variables.resumeFromRevision
  )
    return undefined;
  const oldDelays: Record<string, number> = {
    "interlude-zhu-delay": 30000,
    "interlude-zhang-delay": 30000,
    "interlude-su-1-reply-delay": 3000,
    "interlude-su-2-reply-delay": 3000,
    "interlude-zhu-1-reply-delay": 10000,
    "interlude-zhang-1-reply-delay": 10000,
  };
  const scheduled = saved.scheduled?.map((timer) => {
    const delay = work.nodes.find((n) => n.id === timer.nodeId)?.delayMs;
    return oldDelays[timer.nodeId] && delay !== undefined
      ? { ...timer, due: timer.due + delay - oldDelays[timer.nodeId] }
      : timer;
  });
  return {
    ...saved,
    scheduled,
    revision: work.updatedAt,
    variables: { ...work.variables, ...saved.variables },
  };
}
export function firstContactGlyph(name: string): string {
  if (typeof Intl.Segmenter === "function") {
    for (const part of new Intl.Segmenter("zh", { granularity: "grapheme" }).segment(name)) return part.segment;
  }
  return name.startsWith("🐈‍⬛") ? "🐈‍⬛" : Array.from(name)[0] || "?";
}
