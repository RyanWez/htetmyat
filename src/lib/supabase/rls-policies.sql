-- Enable RLS for tables
ALTER TABLE public.apple_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read Apple IDs
CREATE POLICY "Allow public read access on apple_ids" 
ON public.apple_ids FOR SELECT USING (true);

-- Allow anyone to read Giveaways
CREATE POLICY "Allow public read access on giveaways" 
ON public.giveaways FOR SELECT USING (true);

-- Allow anyone to read Posts
CREATE POLICY "Allow public read access on posts" 
ON public.posts FOR SELECT USING (true);

-- Allow anyone to read Site Settings
CREATE POLICY "Allow public read access on site_settings" 
ON public.site_settings FOR SELECT USING (true);

