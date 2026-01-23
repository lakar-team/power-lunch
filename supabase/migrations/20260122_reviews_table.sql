-- Migration: Create reviews table for session ratings
-- Run this in Supabase SQL Editor

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    reviewer_id UUID NOT NULL REFERENCES auth.users(id),
    reviewee_id UUID NOT NULL REFERENCES auth.users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One review per booking per reviewer
    CONSTRAINT unique_review_per_booking UNIQUE (booking_id, reviewer_id),
    
    -- Prevent self-reviews
    CONSTRAINT no_self_review CHECK (reviewer_id != reviewee_id)
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read reviews (public)
CREATE POLICY "Reviews are viewable by everyone"
    ON reviews FOR SELECT
    USING (true);

-- Only booking participants can insert reviews
CREATE POLICY "Booking participants can create reviews"
    ON reviews FOR INSERT
    WITH CHECK (
        auth.uid() = reviewer_id
        AND EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = booking_id
            AND b.status = 'completed'
            AND (b.guest_id = auth.uid() OR EXISTS (
                SELECT 1 FROM hosts h WHERE h.id = b.host_id AND h.user_id = auth.uid()
            ))
        )
    );

-- Comment for documentation
COMMENT ON TABLE reviews IS 'Session reviews and ratings. One review per booking per participant.';
COMMENT ON COLUMN reviews.rating IS 'Star rating from 1-5';
COMMENT ON COLUMN reviews.reviewee_id IS 'The user being reviewed (host user_id for guest reviews)';
