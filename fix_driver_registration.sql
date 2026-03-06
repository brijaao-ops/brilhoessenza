-- ============================================================
-- FIX: delivery_drivers table - ensure all columns exist
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create the table if it doesn't exist at all
CREATE TABLE IF NOT EXISTS delivery_drivers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now()
);

-- 2. Add all required columns (safe: only adds if missing)
DO $$
BEGIN
    -- Core identification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'name') THEN
        ALTER TABLE delivery_drivers ADD COLUMN name text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'email') THEN
        ALTER TABLE delivery_drivers ADD COLUMN email text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'user_id') THEN
        ALTER TABLE delivery_drivers ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Contact & location
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'whatsapp') THEN
        ALTER TABLE delivery_drivers ADD COLUMN whatsapp text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'phone') THEN
        ALTER TABLE delivery_drivers ADD COLUMN phone text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'address') THEN
        ALTER TABLE delivery_drivers ADD COLUMN address text;
    END IF;

    -- Transport
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'transport_type') THEN
        ALTER TABLE delivery_drivers ADD COLUMN transport_type text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'vehicle_type') THEN
        ALTER TABLE delivery_drivers ADD COLUMN vehicle_type text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'license_plate') THEN
        ALTER TABLE delivery_drivers ADD COLUMN license_plate text;
    END IF;

    -- Photos / documents
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'photo_url') THEN
        ALTER TABLE delivery_drivers ADD COLUMN photo_url text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'id_front_url') THEN
        ALTER TABLE delivery_drivers ADD COLUMN id_front_url text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'id_back_url') THEN
        ALTER TABLE delivery_drivers ADD COLUMN id_back_url text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'selfie_url') THEN
        ALTER TABLE delivery_drivers ADD COLUMN selfie_url text;
    END IF;

    -- AI verification (optional, kept for future use)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'ai_verification_result') THEN
        ALTER TABLE delivery_drivers ADD COLUMN ai_verification_result text;
    END IF;

    -- Status flags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'verified') THEN
        ALTER TABLE delivery_drivers ADD COLUMN verified boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'active') THEN
        ALTER TABLE delivery_drivers ADD COLUMN active boolean DEFAULT true;
    END IF;

    -- Commission tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'commission_balance') THEN
        ALTER TABLE delivery_drivers ADD COLUMN commission_balance numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_drivers' AND column_name = 'total_deliveries') THEN
        ALTER TABLE delivery_drivers ADD COLUMN total_deliveries integer DEFAULT 0;
    END IF;

END $$;

-- 3. Enable RLS
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

-- 4. Drop old conflicting policies (start fresh)
DROP POLICY IF EXISTS "Allow public insert" ON delivery_drivers;
DROP POLICY IF EXISTS "Allow insert for registration" ON delivery_drivers;
DROP POLICY IF EXISTS "Allow anon insert" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can view own profile" ON delivery_drivers;
DROP POLICY IF EXISTS "Admin full access" ON delivery_drivers;
DROP POLICY IF EXISTS "Allow authenticated read" ON delivery_drivers;
DROP POLICY IF EXISTS "Allow authenticated update" ON delivery_drivers;
DROP POLICY IF EXISTS "Allow authenticated delete" ON delivery_drivers;

-- 5. Create clean RLS policies

-- PUBLIC can insert (self-registration from the website)
CREATE POLICY "Allow public insert"
ON delivery_drivers FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Authenticated users (admin/employees) can read all drivers
CREATE POLICY "Allow authenticated read"
ON delivery_drivers FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can update/delete (admin management)
CREATE POLICY "Allow authenticated update"
ON delivery_drivers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete"
ON delivery_drivers FOR DELETE
TO authenticated
USING (true);

-- 6. Fix storage bucket policy for 'drivers' bucket
-- Allow anyone to upload to the drivers bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('drivers', 'drivers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anon to upload to drivers bucket
DROP POLICY IF EXISTS "Allow public upload to drivers" ON storage.objects;
CREATE POLICY "Allow public upload to drivers"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'drivers');

-- Allow public read of drivers bucket
DROP POLICY IF EXISTS "Allow public read of drivers" ON storage.objects;
CREATE POLICY "Allow public read of drivers"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'drivers');

-- 7. Verify: show current columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'delivery_drivers'
ORDER BY ordinal_position;
