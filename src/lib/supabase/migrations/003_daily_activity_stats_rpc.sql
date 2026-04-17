-- ═══════════════════════════════════════════════════════════════════════
-- Migration: get_daily_activity_stats RPC function
-- Purpose: Replaces expensive client-side aggregation with database-side
--          processing for the admin dashboard daily activity chart.
-- 
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_daily_activity_stats()
RETURNS TABLE(name text, daily bigint, non_login bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_of_day timestamptz;
BEGIN
  -- Get start of today in Myanmar timezone (UTC+6:30)
  start_of_day := date_trunc('day', NOW() AT TIME ZONE 'Asia/Yangon') AT TIME ZONE 'Asia/Yangon';
  
  RETURN QUERY
  WITH hours AS (
    SELECT generate_series(0, 22, 2) AS hour_start
  ),
  logs_in_range AS (
    SELECT 
      EXTRACT(HOUR FROM (al.created_at AT TIME ZONE 'Asia/Yangon'))::int AS mmt_hour,
      al.user_id
    FROM activity_logs al
    WHERE al.created_at >= start_of_day
  )
  SELECT 
    (h.hour_start || ':00')::text AS name,
    COUNT(DISTINCT CASE WHEN l.user_id IS NOT NULL THEN l.user_id END)::bigint AS daily,
    COUNT(CASE WHEN l.user_id IS NULL THEN 1 END)::bigint AS non_login
  FROM hours h
  LEFT JOIN logs_in_range l 
    ON l.mmt_hour >= h.hour_start AND l.mmt_hour < h.hour_start + 2
  GROUP BY h.hour_start
  ORDER BY h.hour_start;
END;
$$;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION get_daily_activity_stats() TO service_role;
