/*
  # Fix Infinite Recursion in Profiles RLS Policies

  ## Summary
  Two RLS policies on the `profiles` table were querying the `profiles` table
  inside their USING clause, causing infinite recursion:
  1. "Admin can update any profile" - checked profiles.role = 'admin'
  2. "Cashiers can read profiles for orders" - checked profiles.role IN ('admin','cashier')

  ## Fix
  1. Create a security definer function `get_user_role()` that returns the
     current user's role without triggering RLS recursion (SECURITY DEFINER
     bypasses RLS).
  2. Drop the two recursive policies.
  3. Recreate them using `get_user_role()` instead of subquerying `profiles`.
*/

-- Step 1: Create a security definer function that bypasses RLS
CREATE OR REPLACE FUNCTION get_user_role(check_uid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = check_uid;
$$;

-- Step 2: Drop the recursive policies
DROP POLICY IF EXISTS "Admin can update any profile" ON profiles;
DROP POLICY IF EXISTS "Cashiers can read profiles for orders" ON profiles;

-- Step 3: Recreate using the non-recursive function
CREATE POLICY "Admin can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Cashiers can read profiles for orders"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'cashier'));
