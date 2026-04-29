/*
  # Fix cashier login - copy role to app_metadata and fix get_user_role

  1. Problem
    - The role is stored in user_metadata but get_user_role() queries profiles table
    - This creates RLS recursion: reading profiles requires get_user_role, 
      which requires reading profiles
    - Cashier profile fetch fails, causing automatic logout

  2. Solution
    - Copy role from user_metadata to app_metadata for all existing users
    - Fix get_user_role() to read from JWT app_metadata instead of profiles table
    - This breaks the circular dependency since JWT data is available without DB queries
    - Update the create-cashier edge function to set app_metadata on user creation

  3. Security
    - app_metadata cannot be modified by users (only by admin/service role)
    - This is actually MORE secure than reading from profiles table
*/

-- Copy role from user_metadata to app_metadata for all existing users
UPDATE auth.users
SET raw_app_meta_data = 
  COALESCE(raw_app_meta_data, '{}'::jsonb) || 
  jsonb_build_object('role', COALESCE(raw_user_meta_data->>'role', 'customer'))
WHERE raw_app_meta_data->>'role' IS NULL;

-- Fix get_user_role to read from JWT app_metadata instead of profiles table
CREATE OR REPLACE FUNCTION public.get_user_role(check_uid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'customer');
$$;
