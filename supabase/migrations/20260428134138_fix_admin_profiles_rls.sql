/*
  # Fix admin profiles RLS policies to use JWT directly

  1. Changes
    - Replace get_user_role() calls with direct JWT checks
    - Consistent with other fixed policies
    - Avoids any potential issues with the function
*/

DROP POLICY IF EXISTS "Admin can read cashier profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON profiles;

CREATE POLICY "Admin can read cashier profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    COALESCE(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role',
      'customer'
    ) = 'admin'
  );

CREATE POLICY "Admin can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role',
      'customer'
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role',
      'customer'
    ) = 'admin'
  );
