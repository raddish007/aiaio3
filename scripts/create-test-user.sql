-- Create test admin user for local development
-- Run this in Supabase Studio SQL editor when using local database

-- First create user in auth.users (Supabase auth schema)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440000', -- Generate a UUID
  'authenticated',
  'authenticated',
  'admin@test.com',
  crypt('password123', gen_salt('bf')), -- Password: password123
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Then create user in public.users table
INSERT INTO public.users (
  id,
  email,
  password_hash,
  name,
  role,
  created_at,
  updated_at,
  subscription_status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'admin@test.com',
  crypt('password123', gen_salt('bf')),
  'Test Admin',
  'content_manager',
  NOW(),
  NOW(),
  'active'
);

-- Create a test child
INSERT INTO public.children (
  id,
  name,
  age,
  primary_interest,
  parent_id,
  created_at,
  updated_at
) VALUES (
  '660e8400-e29b-41d4-a716-446655440001',
  'Test Child',
  4,
  'dinosaurs',
  '550e8400-e29b-41d4-a716-446655440000',
  NOW(),
  NOW()
);
