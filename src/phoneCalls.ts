import { dispatch } from "./engine";
import { initialRuntime, type Runtime, type Work } from "./schema";
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
export function phoneIsUnlocked(state: Runtime): boolean {
  return Boolean(state.variables.phoneUnlocked) &&
    state.unlocked.includes("interlude-su-3-reply") &&
    state.completed.includes("interlude-su-3-reply-send");
}
export function startPhoneCall(
  work: Work,
  state: Runtime,
  name: string,
  id: string,
): Runtime {
  if (!phoneIsUnlocked(state) || state.ui?.phone?.activeName)
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
/** Reset incompatible narrative saves once, retaining unrelated App preferences. */
export function resumePhoneStory(work: Work, saved: Runtime): Runtime | undefined {
  if (work.id !== "phone-a-story")
    return saved.revision === work.updatedAt ? saved : undefined;
  const compatible = (saved.revision === work.updatedAt || [45, 46].includes(saved.revision)) &&
    saved.variables.storyGateVersion === work.variables.storyGateVersion &&
    (!saved.variables.phoneUnlocked || phoneIsUnlocked(saved));
  if (compatible) {
    if (saved.revision === work.updatedAt) return saved;
    const next = structuredClone(saved);
    next.revision = work.updatedAt;
    next.variables = { ...work.variables, ...saved.variables };
    const changes: Record<string, number> = saved.revision === 45 ? {
      "interlude-zhu-delay": -5000, "interlude-zhang-delay": -10000,
      "interlude-zhu-1-reply-delay": -2000, "interlude-zhang-1-reply-delay": -2000,
    } : {};
    next.scheduled = next.scheduled?.map(t => ({...t, due: Math.max(next.elapsedMs ?? 0, t.due + (changes[t.nodeId] ?? 0))}));
    if (saved.revision === 45 && next.unlocked.includes("interlude-happy-note")) {
      next.scheduled = [...(next.scheduled ?? []), {nodeId:"phone-calm-message-delay", due:(next.elapsedMs ?? 0) + 40000}];
      if (next.read.includes("interlude-happy-note")) next.variables.finalNoteExitReady = true;
    }
    return next;
  }
  const fresh = dispatch(work, initialRuntime(work), "start");
  fresh.ui = Object.fromEntries(Object.entries(saved.ui ?? {}).filter(
    ([app]) => app !== "phone" && app !== "wechat" && app !== "notes",
  ));
  return fresh;
}
export function firstContactGlyph(name: string): string {
  if (typeof Intl.Segmenter === "function") {
    for (const part of new Intl.Segmenter("zh", { granularity: "grapheme" }).segment(name)) return part.segment;
  }
  return name.startsWith("🐈‍⬛") ? "🐈‍⬛" : Array.from(name)[0] || "?";
}
