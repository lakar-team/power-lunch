-- Host Profiles Table
-- Run this in Supabase SQL Editor

-- Create host_profiles table
CREATE TABLE IF NOT EXISTS host_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  is_main BOOLEAN DEFAULT false,
  name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_host_profiles_host_id ON host_profiles(host_id);

-- Add host_profile_id to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS host_profile_id UUID REFERENCES host_profiles(id);

-- Enable RLS
ALTER TABLE host_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for host_profiles
CREATE POLICY "Users can view their own host profiles" ON host_profiles
  FOR SELECT USING (
    host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own host profiles" ON host_profiles
  FOR INSERT WITH CHECK (
    host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own host profiles" ON host_profiles
  FOR UPDATE USING (
    host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own host profiles" ON host_profiles
  FOR DELETE USING (
    host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
    AND is_main = false  -- Cannot delete main profile
  );

-- Public can view host profiles (for display on listings)
CREATE POLICY "Public can view host profiles" ON host_profiles
  FOR SELECT USING (true);
