import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client for server-side operations (bypasses RLS)
// Only create if service key is available
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Database types (will be generated from schema)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          name: string;
          role: 'parent' | 'content_manager' | 'asset_creator' | 'video_ops';
          created_at: string;
          updated_at: string;
          last_login: string | null;
          subscription_status: string;
          metadata: any;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          name: string;
          role?: 'parent' | 'content_manager' | 'asset_creator' | 'video_ops';
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          subscription_status?: string;
          metadata?: any;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          name?: string;
          role?: 'parent' | 'content_manager' | 'asset_creator' | 'video_ops';
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          subscription_status?: string;
          metadata?: any;
        };
      };
      children: {
        Row: {
          id: string;
          parent_id: string;
          name: string;
          age: number;
          primary_interest: string;
          profile_photo_url: string | null;
          created_at: string;
          updated_at: string;
          metadata: any;
        };
        Insert: {
          id?: string;
          parent_id: string;
          name: string;
          age: number;
          primary_interest: string;
          profile_photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: any;
        };
        Update: {
          id?: string;
          parent_id?: string;
          name?: string;
          age?: number;
          primary_interest?: string;
          profile_photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: any;
        };
      };
      assets: {
        Row: {
          id: string;
          type: 'image' | 'audio' | 'video' | 'prompt';
          theme: string;
          tags: string[];
          age_range: string | null;
          safe_zone: string | null;
          status: 'pending' | 'approved' | 'rejected';
          created_by: string | null;
          approved_by: string | null;
          approval_notes: string | null;
          rejection_reason: string | null;
          created_at: string;
          approved_at: string | null;
          file_url: string | null;
          metadata: any;
          usage_count: number;
        };
        Insert: {
          id?: string;
          type: 'image' | 'audio' | 'video' | 'prompt';
          theme: string;
          tags?: string[];
          age_range?: string | null;
          safe_zone?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          created_by?: string | null;
          approved_by?: string | null;
          approval_notes?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          approved_at?: string | null;
          file_url?: string | null;
          metadata?: any;
          usage_count?: number;
        };
        Update: {
          id?: string;
          type?: 'image' | 'audio' | 'video' | 'prompt';
          theme?: string;
          tags?: string[];
          age_range?: string | null;
          safe_zone?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          created_by?: string | null;
          approved_by?: string | null;
          approval_notes?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          approved_at?: string | null;
          file_url?: string | null;
          metadata?: any;
          usage_count?: number;
        };
      };
      episodes: {
        Row: {
          id: string;
          child_id: string;
          episode_number: number;
          delivery_date: string;
          status: 'pending' | 'in_progress' | 'ready' | 'delivered' | 'failed';
          created_at: string;
          updated_at: string;
          assembly_log: any;
          qa_status: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          episode_number: number;
          delivery_date: string;
          status?: 'pending' | 'in_progress' | 'ready' | 'delivered' | 'failed';
          created_at?: string;
          updated_at?: string;
          assembly_log?: any;
          qa_status?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          episode_number?: number;
          delivery_date?: string;
          status?: 'pending' | 'in_progress' | 'ready' | 'delivered' | 'failed';
          created_at?: string;
          updated_at?: string;
          assembly_log?: any;
          qa_status?: string;
        };
      };
      content: {
        Row: {
          id: string;
          child_id: string;
          type: 'initial' | 'weekly_episode' | 'segment';
          title: string;
          description: string | null;
          video_url: string | null;
          status: 'pending' | 'in_progress' | 'ready' | 'delivered' | 'failed';
          delivery_date: string | null;
          created_at: string;
          updated_at: string;
          metadata: any;
        };
        Insert: {
          id?: string;
          child_id: string;
          type: 'initial' | 'weekly_episode' | 'segment';
          title: string;
          description?: string | null;
          video_url?: string | null;
          status?: 'pending' | 'in_progress' | 'ready' | 'delivered' | 'failed';
          delivery_date?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: any;
        };
        Update: {
          id?: string;
          child_id?: string;
          type?: 'initial' | 'weekly_episode' | 'segment';
          title?: string;
          description?: string | null;
          video_url?: string | null;
          status?: 'pending' | 'in_progress' | 'ready' | 'delivered' | 'failed';
          delivery_date?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: any;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertDto<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateDto<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']; 