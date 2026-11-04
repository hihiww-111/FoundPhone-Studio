import type { Runtime } from "./schema";
const key = (id: string) => "foundphone-visit-v1:" + id;
export function readVisitSave(id: string, navigation: string, storage: Pick<Storage, "getItem" | "removeItem">): { state: Runtime } | undefined {
  if (navigation !== "reload") {
    storage.removeItem(key(id));
    return undefined;
  }
  const text = storage.getItem(key(id));
  return text ? { state: JSON.parse(text) as Runtime } : undefined;
}
export function writeVisitSave(id: string, state: Runtime, storage: Pick<Storage, "setItem">): void {
  storage.setItem(key(id), JSON.stringify(state));
}
