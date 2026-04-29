/*
  # Fix admin orders RLS policies to avoid profiles table recursion

  1. Problem
    - Admin policies on orders table query profiles table to check role
    - Same recursion risk as cashier policies

  2. Solution
    - Replace profiles table lookups with JWT-based role checks
*/

DROP POLICY IF EXISTS "Admins can read all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

CREATE POLICY "Admins can read all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    COALESCE(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role',
      'customer'
    ) = 'admin'
  );

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
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
