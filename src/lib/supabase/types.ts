// Database types matching schema.sql

export interface AppleId {
  id: string;
  title: string;
  description: string;
  images: string[];
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
  display_name_changed_at: string | null;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title_template: string;
  message_template: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  type: 'global' | 'personal';
  user_id: string | null;
  created_at: string;
}

export interface UserNotiRead {
  id: string;
  user_id: string;
  notification_id: string;
  read_at: string;
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
      notification_templates: {
        Row: NotificationTemplate;
        Insert: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
      user_noti_reads: {
        Row: UserNotiRead;
        Insert: Omit<UserNotiRead, 'id' | 'read_at'>;
        Update: Partial<Omit<UserNotiRead, 'id' | 'read_at'>>;
      };
    };
  };
}
