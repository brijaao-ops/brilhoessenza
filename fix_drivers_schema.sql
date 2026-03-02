-- Migration: Add missing columns to delivery_drivers table
-- Run this in Supabase SQL Editor

DO $$
BEGIN
    -- transport_type (replaces/supplements vehicle_type for public registration form)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'delivery_drivers' AND column_name = 'transport_type') THEN
        ALTER TABLE delivery_drivers ADD COLUMN transport_type text;
    END IF;

    -- whatsapp (replaces/supplements phone for public registration form)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'delivery_drivers' AND column_name = 'whatsapp') THEN
        ALTER TABLE delivery_drivers ADD COLUMN whatsapp text;
    END IF;

    -- address (residential address for drivers)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'delivery_drivers' AND column_name = 'address') THEN
        ALTER TABLE delivery_drivers ADD COLUMN address text;
    END IF;

    -- id_front_url (photo of front of ID card)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'delivery_drivers' AND column_name = 'id_front_url') THEN
        ALTER TABLE delivery_drivers ADD COLUMN id_front_url text;
    END IF;

    -- id_back_url (photo of back of ID card)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'delivery_drivers' AND column_name = 'id_back_url') THEN
        ALTER TABLE delivery_drivers ADD COLUMN id_back_url text;
    END IF;

    -- selfie_url (selfie photo for biometric verification)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'delivery_drivers' AND column_name = 'selfie_url') THEN
        ALTER TABLE delivery_drivers ADD COLUMN selfie_url text;
    END IF;

    -- active (whether driver is currently active)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'delivery_drivers' AND column_name = 'active') THEN
        ALTER TABLE delivery_drivers ADD COLUMN active boolean DEFAULT true;
    END IF;
END $$;

-- Allow anonymous users to INSERT new driver registrations (public-facing page)
-- RLS Policy: anyone can create a pending driver record (verified=false)
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Drop old insert policies if they exist, then re-create
DROP POLICY IF EXISTS "Allow public driver registration" ON delivery_drivers;

CREATE POLICY "Allow public driver registration"
ON delivery_drivers
FOR INSERT
TO anon, authenticated
WITH CHECK (verified = false);

-- Drop old select policy if needed
DROP POLICY IF EXISTS "Allow drivers to read own record" ON delivery_drivers;
DROP POLICY IF EXISTS "Allow authenticated users to read drivers" ON delivery_drivers;

CREATE POLICY "Allow authenticated users to read drivers"
ON delivery_drivers
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users (admins) to update and delete
DROP POLICY IF EXISTS "Allow admins to manage drivers" ON delivery_drivers;

CREATE POLICY "Allow admins to manage drivers"
ON delivery_drivers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
