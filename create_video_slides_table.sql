-- Create video_slides table
CREATE TABLE IF NOT EXISTS public.video_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    video_url TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_slides ENABLE ROW LEVEL SECURITY;

-- Policies for public viewing
CREATE POLICY "Public video_slides are viewable by everyone" 
ON public.video_slides FOR SELECT 
USING (active = true);

-- Policies for admin management
CREATE POLICY "Admins can do everything on video_slides" 
ON public.video_slides FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
