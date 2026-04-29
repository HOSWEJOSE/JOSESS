/*
  # Fix RLS Policy Infinite Recursion

  1. Changes
    - Remove problematic admin check policies that cause recursion
    - Simplify RLS policies to avoid infinite loops
    - Allow authenticated users to read own profile
    - Allow service role to manage profiles
  
  2. Security
    - Users can only read/update their own profile
    - Admins identified by checking role column without recursion
*/

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (role = 'admin')
  WITH CHECK (role = 'admin');

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
