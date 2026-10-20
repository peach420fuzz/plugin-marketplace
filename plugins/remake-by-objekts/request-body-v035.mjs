// Bound untrusted HTTP input while streaming, before allocating a complete body.
// No payload, credential or source URL is included in an error or a log.
export class BodyError extends Error {
  constructor(code, status) { super(code); this.status = status; }
}

export async function readBoundedBody(request, limit, {timeoutMs = 12000} = {}) {
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared)))) {
    throw new BodyError("invalid_content_length", 400);
  }
  if (declared !== null && Number(declared) > limit) {
    // Do not consume the body to discover what the header already establishes.
    if (request.body) void request.body.cancel().catch(() => {});
    throw new BodyError("request_too_large", 413);
  }
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0, timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new BodyError("request_body_timeout", 408)), timeoutMs);
  });
  try {
    while (true) {
      const {done, value} = await Promise.race([reader.read(), deadline]);
      if (done) break;
      if (!(value instanceof Uint8Array)) throw new BodyError("unreadable_body", 400);
      size += value.byteLength;
      if (size > limit) throw new BodyError("request_too_large", 413);
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    try { return new TextDecoder("utf-8", {fatal: true}).decode(bytes); }
    catch { throw new BodyError("invalid_utf8", 400); }
  } catch (error) {
    // A broken upstream cancel hook must not hold the error response open.
    void reader.cancel().catch(() => {});
    throw error instanceof BodyError ? error : new BodyError("unreadable_body", 400);
  } finally {
    clearTimeout(timer);
    try { reader.releaseLock(); } catch {}
  }
}
