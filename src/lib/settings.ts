import { unstable_cache } from 'next/cache';

// Define the shape of our site settings
export interface SiteSettings {
  id: number;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  maintenance_end_time: string | null;
  updated_at: string;
}

const defaultSettings: SiteSettings = {
  id: 1,
  maintenance_mode: false,
  maintenance_message: 'We are currently under maintenance. Please check back later.',
  maintenance_end_time: null,
  updated_at: new Date().toISOString(),
};

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      const { createServiceClient } = await import('@/lib/supabase/server');
      const supabase = await createServiceClient();
      
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1);
        
      if (error || !data || data.length === 0) {
        console.error('Failed to fetch site_settings from Supabase:', error?.message);
        return defaultSettings;
      }
      
      return data[0] as SiteSettings;
    } catch (err) {
      console.error('Error in getSiteSettings:', err);
      return defaultSettings;
    }
  },
  ['site_settings_cache'], // Cache key
  { tags: ['site_settings'] } // Tag for on-demand revalidation
);
