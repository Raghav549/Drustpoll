type Bucket = { count: number; resetAt: number };

// Development fallback only. Production must use a shared Redis/database limiter
// so limits cannot be bypassed by moving requests between server instances.
const buckets = new Map<string, Bucket>();

export function consumeLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function cleanupRateLimitBuckets(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}
