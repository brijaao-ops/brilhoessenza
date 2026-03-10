-- Create table for multiple product images
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_main BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- RLS Policies
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for the store frontend)
CREATE POLICY "Allow public read access to product images" ON product_images
    FOR SELECT USING (true);

-- Allow authenticated users to manage images (admins/employees)
CREATE POLICY "Allow authenticated users to manage product images" ON product_images
    FOR ALL USING (auth.role() = 'authenticated');

-- Note: In Supabase, if a "products" record is updated, we might want to sync the primary image 
-- or we can just rely on the first image marked as is_main.
