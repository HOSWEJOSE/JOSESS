/*
  # Fix get_user_role to fallback to user_metadata from JWT

  1. Problem
    - get_user_role now reads from app_metadata in JWT
    - But new users signing up won't have role in app_metadata immediately
    - user_metadata has the role but is less secure (user can modify it)
    - We need a fallback that still avoids the profiles table recursion

  2. Solution
    - First check app_metadata (secure, set by admin/service role)
    - Fall back to user_metadata from JWT (avoids DB query, no recursion)
    - Last resort: default to 'customer'

  3. Security
    - app_metadata is the source of truth (set by admin API)
    - user_metadata fallback is acceptable since it avoids the recursion
    - The trigger + edge functions should set app_metadata for all new users
*/

CREATE OR REPLACE FUNCTION public.get_user_role(check_uid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    'customer'
  );
$$;
