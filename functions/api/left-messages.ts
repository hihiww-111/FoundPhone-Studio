type Result = { success: boolean; meta?: { changes?: number } };
type Statement = { bind(...values: unknown[]): Statement; run(): Promise<Result> };
export type CollectionEnv = { LEFT_MESSAGES?: { prepare(sql: string): Statement }; COLLECTION_ENABLED?: string };

const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const reply = (status: number) => new Response(null, { status, headers });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Write-only. Reading/exporting requires the owner's Cloudflare account, never a website key. */
export async function onRequest({ request, env }: { request: Request; env: CollectionEnv }): Promise<Response> {
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { ...headers, Allow: "POST" } });
  const url = new URL(request.url);
  if (url.hostname !== "zj-phone.pages.dev" || request.headers.get("Origin") !== url.origin) return reply(403);
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) return reply(415);
  if (env.COLLECTION_ENABLED !== "true" || !env.LEFT_MESSAGES) return reply(503);
  // Read a bounded stream rather than trusting a caller-supplied Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return reply(400);
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    if (bytes > 20000) { await reader.cancel(); return reply(413); }
    chunks.push(chunk.value);
  }
  const body = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  let data: unknown;
  try { data = JSON.parse(new TextDecoder().decode(body)); } catch { return reply(400); }
  if (!data || typeof data !== "object") return reply(400);
  const { id, sessionId, text } = data as Record<string, unknown>;
  if (typeof id !== "string" || !uuid.test(id) || typeof sessionId !== "string" || !uuid.test(sessionId)
    || typeof text !== "string" || !text.trim() || text.length > 4000) return reply(400);
  try {
    // Atomic rate bound per anonymous visit; repeated delivery of an ID cannot duplicate a row.
    const result = await env.LEFT_MESSAGES.prepare(`INSERT OR IGNORE INTO left_messages (id, session_id, message, received_at)
      SELECT ?1, ?2, ?3, ?4 WHERE
      (SELECT COUNT(*) FROM left_messages WHERE session_id = ?2 AND received_at >= ?5) < 100`)
      .bind(id, sessionId, text.trim(), new Date().toISOString(), new Date(Date.now() - 86400000).toISOString()).run();
    return reply(result.success ? 204 : 503);
  } catch { return reply(503); }
}
