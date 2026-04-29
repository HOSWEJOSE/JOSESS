/*
  # Fix staff_logs RLS policy to avoid profiles table recursion

  1. Changes
    - Replace profiles table lookup with JWT-based role check
*/

DROP POLICY IF EXISTS "Admins can read all staff logs" ON staff_logs;

CREATE POLICY "Admins can read all staff logs"
  ON staff_logs FOR SELECT
  TO authenticated
  USING (
    COALESCE(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role',
      'customer'
    ) = 'admin'
  );
