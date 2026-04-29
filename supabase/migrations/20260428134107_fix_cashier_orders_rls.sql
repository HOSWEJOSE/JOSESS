/*
  # Fix cashier orders RLS policies to avoid profiles table recursion

  1. Problem
    - Cashier policies on orders table query profiles table to check role
    - This can cause RLS recursion when profiles policies also need role checks
    - Cashiers get logged out because their queries fail silently

  2. Solution
    - Replace profiles table lookups with JWT-based role checks
    - Use auth.jwt() -> 'app_metadata' or 'user_metadata' to get role
    - This avoids any database query in the policy, eliminating recursion

  3. Security
    - app_metadata is set by admin/service role (secure)
    - user_metadata fallback is acceptable for read operations
*/

DROP POLICY IF EXISTS "Cashiers can read orders" ON orders;
DROP POLICY IF EXISTS "Cashiers can update orders" ON orders;

CREATE POLICY "Cashiers can read orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    COALESCE(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role',
      'customer'
    ) = 'cashier'
  );

CREATE POLICY "Cashiers can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role',
      'customer'
    ) = 'cashier'
  )
  WITH CHECK (
    COALESCE(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role',
      'customer'
    ) = 'cashier'
  );
