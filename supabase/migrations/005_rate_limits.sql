-- Waqood App: Rate Limiting Table
-- Replaces in-memory rate limiting with a database-backed store
-- Ensures rate limits work across serverless instances and cold starts

-- ============================================================
-- 1. Create rate_limits table
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes')
);

-- ============================================================
-- 2. Index for cleanup queries (optional, for a cron job)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits (reset_at);

-- ============================================================
-- 3. RLS policies - only authenticated users can write rate limit data
--    (middleware reads happen via service role, bypassing RLS by default)
-- ============================================================
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Public read is not allowed by default; rate limiting works server-side
-- without RLS via the service role key if configured, or we can allow anon
-- reads since the keys themselves are hashed identifiers (IP-prefixed).

-- Allow anonymous upsert/select for rate limiting to function in middleware
CREATE POLICY "anon can read rate_limits for rate limiting" ON rate_limits
  FOR SELECT USING (true);

CREATE POLICY "anon can insert rate_limits" ON rate_limits
  FOR INSERT WITH CHECK (true);

CREATE POLICY "anon can update rate_limits" ON rate_limits
  FOR UPDATE USING (true);
