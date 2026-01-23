-- Migration: Add columns for session verification and completion
-- Run this in Supabase SQL Editor

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Comment for documentation
COMMENT ON COLUMN bookings.verified_at IS 'When the host scanned/verified the guest code.';
COMMENT ON COLUMN bookings.completed_at IS 'When the session was officially marked as completed.';
