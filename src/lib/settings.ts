import { unstable_cache } from 'next/cache';

// Define the shape of our site settings
export interface SiteSettings {
  id: number;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  maintenance_end_time: string | null;
  max_devices_default: number;
  updated_at: string;
}

const defaultSettings: SiteSettings = {
  id: 1,
  maintenance_mode: false,
  maintenance_message: 'We are currently under maintenance. Please check back later.',
  maintenance_end_time: null,
  max_devices_default: 1,
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
      
      const settings = data[0] as SiteSettings;

      // Auto-disable maintenance mode if the end time has passed
      if (
        settings.maintenance_mode &&
        settings.maintenance_end_time &&
        new Date(settings.maintenance_end_time).getTime() <= Date.now()
      ) {
        const { error: updateError } = await supabase
          .from('site_settings')
          .update({
            maintenance_mode: false,
            maintenance_end_time: null,
          })
          .eq('id', settings.id);

        if (!updateError) {
          settings.maintenance_mode = false;
          settings.maintenance_end_time = null;
        }
      }

      return settings;
    } catch (err) {
      console.error('Error in getSiteSettings:', err);
      return defaultSettings;
    }
  },
  ['site_settings_cache'], // Cache key
  { tags: ['site_settings'], revalidate: 30 } // Revalidate every 30s so timer expiry is detected promptly
);
