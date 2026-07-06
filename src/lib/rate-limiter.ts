import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory fallback for development
const memoryStore = new Map<string, RateLimitEntry>();

/**
 * Check rate limit for a given key.
 * Uses database when available, falls back to memory.
 */
export async function checkRateLimit(key: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("rate_limits")
      .select("count, reset_at")
      .eq("key", key)
      .single();

    const now = Date.now();

    if (!data || now > new Date(data.reset_at).getTime()) {
      await supabase.from("rate_limits").upsert({
        key,
        count: 1,
        reset_at: new Date(now + WINDOW_MS).toISOString(),
      });
      return true;
    }

    if (data.count >= MAX_ATTEMPTS) {
      return false;
    }

    await supabase
      .from("rate_limits")
      .update({ count: data.count + 1 })
      .eq("key", key);

    return true;
  } catch {
    // Fallback to memory-based rate limiting
    const now = Date.now();
    const entry = memoryStore.get(key);

    if (!entry || now > entry.resetAt) {
      memoryStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }

    if (entry.count >= MAX_ATTEMPTS) return false;

    entry.count++;
    return true;
  }
}

/**
 * Get client IP from request headers
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  );
}
