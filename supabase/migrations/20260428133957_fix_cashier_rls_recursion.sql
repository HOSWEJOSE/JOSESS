/*
  # Fix RLS recursion for cashier profile access

  1. Problem
    - The "Cashiers can read profiles for orders" policy uses get_user_role()
    - get_user_role() queries the profiles table, creating a circular RLS dependency
    - This causes profile fetches to fail for cashiers, leading to automatic logout

  2. Solution
    - Drop the problematic policy that uses get_user_role() for cashiers
    - Replace with a policy that uses auth.jwt() to check the role from user_metadata
    - This avoids the circular dependency since JWT data is available without querying profiles

  3. Security
    - The new policy checks the role from raw_app_meta_data in the JWT
    - app_metadata cannot be modified by the user, so this is secure
    - Cashiers can only SELECT profiles (no insert/update/delete)
*/

DROP POLICY IF EXISTS "Cashiers can read profiles for orders" ON profiles;

CREATE POLICY "Cashiers can read profiles for orders"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'cashier')
  );
