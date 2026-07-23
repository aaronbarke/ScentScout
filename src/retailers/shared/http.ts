/**
 * Polite HTTP retrieval shared by adapters: bounded retries with exponential
 * backoff + jitter, hard timeouts, and a per-host minimum interval between
 * requests. We identify ourselves honestly and never attempt to defeat any
 * protection — a 403/429 is respected, not worked around.
 */

export const DEFAULT_USER_AGENT =
  "ScentScoutBot/0.1 (+https://github.com/aaronbarke/ScentScout) price-comparison";

export interface FetchOptions {
  timeoutMs?: number;
  maxRetries?: number;
  /** Minimum spacing between requests to the same host. */
  minIntervalMs?: number;
  userAgent?: string;
  signal?: AbortSignal;
}

export interface FetchResult {
  url: string;
  status: number;
  body: string;
  fetchedAt: Date;
}

/** Thrown when retrieval fails. Callers must treat this as UNKNOWN, not out-of-stock. */
export class RetrievalError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly url: string,
  ) {
    super(message);
    this.name = "RetrievalError";
  }
}

const lastRequestAt = new Map<string, number>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Status codes worth retrying. 4xx (except 429) are permanent — don't hammer. */
function isRetryable(status: number): boolean {
  return status === 429 || status === 408 || (status >= 500 && status < 600);
}

async function respectRateLimit(host: string, minIntervalMs: number): Promise<void> {
  const last = lastRequestAt.get(host);
  const now = Date.now();
  if (last !== undefined) {
    const wait = last + minIntervalMs - now;
    if (wait > 0) await sleep(wait);
  }
  lastRequestAt.set(host, Date.now());
}

/** Full jitter backoff: random between 0 and base * 2^attempt, capped. */
function backoffMs(attempt: number, baseMs = 500, capMs = 10_000): number {
  const ceiling = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.floor(Math.random() * ceiling);
}

export async function fetchText(url: string, opts: FetchOptions = {}): Promise<FetchResult> {
  const {
    timeoutMs = 15_000,
    maxRetries = 2,
    minIntervalMs = 1_000,
    userAgent = DEFAULT_USER_AGENT,
    signal,
  } = opts;

  const host = new URL(url).host;
  let lastErr: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) await sleep(backoffMs(attempt - 1));
    await respectRateLimit(host, minIntervalMs);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    signal?.addEventListener("abort", onAbort, { once: true });

    try {
      const res = await fetch(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": userAgent,
          accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9",
        },
      });

      if (!res.ok) {
        if (isRetryable(res.status) && attempt < maxRetries) {
          lastErr = new RetrievalError(`HTTP ${res.status}`, res.status, url);
          continue;
        }
        throw new RetrievalError(`HTTP ${res.status}`, res.status, url);
      }

      return { url: res.url || url, status: res.status, body: await res.text(), fetchedAt: new Date() };
    } catch (err) {
      const e = err as Error;
      if (e instanceof RetrievalError) {
        if (attempt >= maxRetries || !isRetryable(e.status ?? 0)) throw e;
        lastErr = e;
        continue;
      }
      lastErr = e;
      if (attempt >= maxRetries) {
        throw new RetrievalError(`${e.name}: ${e.message}`, null, url);
      }
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }

  throw new RetrievalError(lastErr?.message ?? "retrieval failed", null, url);
}

/** Test seam: clear per-host rate-limit state. */
export function __resetRateLimiter(): void {
  lastRequestAt.clear();
}
