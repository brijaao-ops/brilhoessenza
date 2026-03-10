-- Run this in your Supabase SQL Editor to create the drivers storage bucket
-- and fix the RLS policies for driver registration

-- 1. Create the drivers storage bucket (if not using the 'slides' bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('drivers', 'drivers', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow anyone to upload to the drivers bucket (for registration)
CREATE POLICY IF NOT EXISTS "Allow public uploads to drivers"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'drivers');

-- 3. Allow anyone to read from the drivers bucket
CREATE POLICY IF NOT EXISTS "Allow public read from drivers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'drivers');

-- 4. Ensure delivery_drivers allows anonymous INSERT (for self-registration)
-- Check current policies first:
-- SELECT * FROM pg_policies WHERE tablename = 'delivery_drivers';

-- If INSERT is blocked for anon, add this policy:
CREATE POLICY IF NOT EXISTS "Allow anonymous driver registration"
ON public.delivery_drivers FOR INSERT
TO anon
WITH CHECK (true);

-- 5. Allow anon to read delivery_drivers (needed for login check)
CREATE POLICY IF NOT EXISTS "Allow public read delivery_drivers"
ON public.delivery_drivers FOR SELECT
TO anon
USING (true);
