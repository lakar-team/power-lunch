-- Migration: Add columns for upfront payment flow with host response deadline
-- Run this in Supabase SQL Editor

-- Add new columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS host_response_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_authorized_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS declined_reason TEXT;

-- Update the status check constraint to include new statuses
-- First drop existing constraint if it exists
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add new constraint with all status values
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN (
    'pending_payment',  -- Booking created, guest needs to complete payment
    'pending_host',     -- Guest paid (authorization hold), waiting for host response
    'confirmed',        -- Host accepted, payment captured
    'declined',         -- Host declined, payment hold released
    'expired',          -- Host didn't respond in time, payment hold released
    'cancelled',        -- Guest or host cancelled after confirmation
    'completed',        -- Session finished successfully
    'pending'           -- Legacy: kept for backwards compatibility
));

-- Create index for finding expired bookings efficiently
CREATE INDEX IF NOT EXISTS idx_bookings_pending_deadline 
ON bookings (host_response_deadline) 
WHERE status = 'pending_host';

-- Comment for documentation
COMMENT ON COLUMN bookings.host_response_deadline IS 'Deadline for host to accept/decline. Min of (72h from creation) or (2h before event).';
COMMENT ON COLUMN bookings.payment_authorized_at IS 'When the guest authorized (held) payment.';
COMMENT ON COLUMN bookings.declined_at IS 'When the host declined the booking.';
COMMENT ON COLUMN bookings.expired_at IS 'When the booking auto-expired due to no host response.';
