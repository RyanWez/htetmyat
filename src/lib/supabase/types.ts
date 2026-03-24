// Database types matching schema.sql

export interface AppleId {
  id: string;
  email: string;
  password: string;
  country: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  slug: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      apple_ids: {
        Row: AppleId;
        Insert: Omit<AppleId, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AppleId, 'id' | 'created_at' | 'updated_at'>>;
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Post, 'id' | 'created_at' | 'updated_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
