/**
 * Fixed-window rate limiter kept in memory. On Vercel each serverless instance
 * has its own window, which is enough to stop casual abuse of the AI route.
 * For a hard global limit, swap this for a shared store such as Upstash Redis.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  if (windows.size > 10_000) {
    for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
  }
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  current.count += 1;
  if (current.count > limit) return { ok: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}

export function clientIp(request: { headers: Pick<Headers, "get"> }): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function tooMany(retryAfter: number): Response {
  return Response.json({ error: "Too many requests. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
}
