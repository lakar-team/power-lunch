-- Migration: Add new host system tables
-- Run this in Supabase SQL Editor

-- 1. Add topics array to hosts table
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}';

-- 2. Create host_locations table (hosts can have multiple location pins)
CREATE TABLE IF NOT EXISTS host_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                    -- e.g., "Tokyo Office", "Sendai Base"
    location_area TEXT,                    -- e.g., "Shibuya, Tokyo"
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    session_type TEXT DEFAULT 'both' CHECK (session_type IN ('in_person', 'online', 'both')),
    meet_link TEXT,                        -- for online sessions
    venue_options JSONB DEFAULT '[]',      -- array of venue choices
    price_yen INTEGER DEFAULT 1500,
    duration_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    date_start DATE,                       -- when this pin is active from (null = immediately)
    date_end DATE,                         -- when this pin is active until (null = ongoing)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create availability_slots table (flexible scheduling)
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_location_id UUID NOT NULL REFERENCES host_locations(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    specific_date DATE,                    -- for non-recurring availability
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN DEFAULT true,     -- true = weekly, false = specific date only
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_host_locations_host_id ON host_locations(host_id);
CREATE INDEX IF NOT EXISTS idx_host_locations_active ON host_locations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_host_locations_coords ON host_locations(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_availability_slots_location ON availability_slots(host_location_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_day ON availability_slots(day_of_week) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_hosts_topics ON hosts USING GIN(topics);

-- 5. Enable RLS on new tables
ALTER TABLE host_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for host_locations
CREATE POLICY "Anyone can view active host locations" ON host_locations
    FOR SELECT USING (is_active = true);

CREATE POLICY "Hosts can manage their own locations" ON host_locations
    FOR ALL USING (
        host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
    );

-- 7. RLS Policies for availability_slots
CREATE POLICY "Anyone can view availability slots" ON availability_slots
    FOR SELECT USING (true);

CREATE POLICY "Hosts can manage their own availability" ON availability_slots
    FOR ALL USING (
        host_location_id IN (
            SELECT id FROM host_locations 
            WHERE host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
        )
    );

-- 8. Update function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_host_locations_updated_at
    BEFORE UPDATE ON host_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
