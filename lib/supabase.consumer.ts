import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Consumer-focused database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'parent';
          created_at: string;
          updated_at: string;
          subscription_status: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: 'parent';
          subscription_status?: string;
        };
        Update: {
          email?: string;
          name?: string;
          subscription_status?: string;
        };
      };
      children: {
        Row: {
          id: string;
          parent_id: string;
          name: string;
          age: number;
          theme: string;
          icon: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          name: string;
          age: number;
          theme: string;
          icon: string;
        };
        Update: {
          name?: string;
          age?: number;
          theme?: string;
          icon?: string;
        };
      };
      child_approved_videos: {
        Row: {
          id: string;
          child_id: string;
          video_title: string;
          consumer_title: string;
          consumer_description: string;
          video_url: string;
          display_image_url: string;
          approval_status: 'approved';
          duration_seconds: number;
          created_at: string;
          template_type: string;
        };
        Insert: never; // Consumer app doesn't insert videos
        Update: never; // Consumer app doesn't update videos
      };
    };
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type Child = Database['public']['Tables']['children']['Row'];
export type ChildVideo = Database['public']['Tables']['child_approved_videos']['Row'];
