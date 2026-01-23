-- Migration: Create messages table for real-time chat
-- Run this in Supabase SQL Editor

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages(booking_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Booking participants can read messages
CREATE POLICY "Booking participants can read messages"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = booking_id
            AND (
                b.guest_id = auth.uid()
                OR EXISTS (SELECT 1 FROM hosts h WHERE h.id = b.host_id AND h.user_id = auth.uid())
            )
        )
    );

-- Booking participants can insert messages
CREATE POLICY "Booking participants can insert messages"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = booking_id
            AND b.status = 'confirmed'
            AND (
                b.guest_id = auth.uid()
                OR EXISTS (SELECT 1 FROM hosts h WHERE h.id = b.host_id AND h.user_id = auth.uid())
            )
        )
    );

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Comment for documentation
COMMENT ON TABLE messages IS 'Real-time chat messages between booking participants';
