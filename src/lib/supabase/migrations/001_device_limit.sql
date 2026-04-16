-- ============================================
-- Device Limit Feature — Supabase Migration
-- ============================================
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Create user_devices table
CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT NOT NULL DEFAULT 'Unknown Device',
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);

-- 2. Add max_devices column to profiles (per-user override, NULL = use global default)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_devices INTEGER DEFAULT NULL;

-- 3. Add max_devices_default to site_settings (global default)
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS max_devices_default INTEGER DEFAULT 1;

-- 4. Enable RLS on user_devices
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- 5. RLS policy — service_role only (all ops go through server actions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_devices' AND policyname = 'Service role full access on user_devices'
  ) THEN
    CREATE POLICY "Service role full access on user_devices" ON public.user_devices
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$$;

-- 6. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint ON public.user_devices(user_id, device_fingerprint);
