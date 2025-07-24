-- Check and fix the user creation trigger
-- Run this in your Supabase SQL Editor

-- 1. Check if the trigger exists
SELECT 'Trigger Status:' as info;
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check if the function exists
SELECT 'Function Status:' as info;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 3. Drop and recreate the trigger to ensure it's working
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Create or replace the function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the trigger execution
    RAISE NOTICE 'Trigger executing for user: %', NEW.email;
    
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
        'parent'::user_role
    );
    
    RAISE NOTICE 'User record created successfully for: %', NEW.email;
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'User already exists: %', NEW.email;
        RETURN NEW;
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating user record: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. Verify the trigger is created
SELECT 'Trigger Created:' as info;
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 7. Check recent users in auth.users
SELECT 'Recent Auth Users:' as info;
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 8. Check recent users in public.users
SELECT 'Recent Public Users:' as info;
SELECT id, email, name, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5; 