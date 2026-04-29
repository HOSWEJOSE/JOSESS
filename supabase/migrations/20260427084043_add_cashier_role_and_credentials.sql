/*
  # Add Cashier Role Support

  ## Summary
  Extends the profiles table role to include 'cashier' and adds a cashier_credentials
  table so admins can create cashier accounts with Full Name, ID Number, and Password.
  The ID Number serves as the cashier's login username.

  ## Changes
  1. Alter profiles role check constraint to include 'cashier'
  2. Create `cashier_credentials` table
     - `id` (uuid, primary key)
     - `profile_id` (uuid, FK to profiles.id) - links to the auth profile
     - `full_name` (text) - cashier's full name
     - `id_number` (text, unique) - used as login username
     - `created_by` (uuid, FK to profiles.id) - which admin created this cashier
     - `created_at` (timestamptz)
  3. RLS on cashier_credentials - admins can CRUD, cashiers can read own record
  4. Update existing RLS policies that check role = 'admin' to also allow 'cashier'
     where appropriate (e.g., orders read access)
*/

-- Step 1: Update the role check constraint to include 'cashier'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'customer', 'cashier'));

-- Step 2: Create cashier_credentials table
CREATE TABLE IF NOT EXISTS cashier_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  id_number text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT fk_cashier_profile
    FOREIGN KEY (profile_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_cashier_creator
    FOREIGN KEY (created_by)
    REFERENCES profiles(id)
    ON DELETE CASCADE
);

-- Step 3: Enable RLS
ALTER TABLE cashier_credentials ENABLE ROW LEVEL SECURITY;

-- Admins can read all cashier credentials
CREATE POLICY "Admins can read all cashier credentials"
  ON cashier_credentials
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can insert cashier credentials
CREATE POLICY "Admins can insert cashier credentials"
  ON cashier_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete cashier credentials
CREATE POLICY "Admins can delete cashier credentials"
  ON cashier_credentials
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Cashiers can read their own credential record
CREATE POLICY "Cashiers can read own credentials"
  ON cashier_credentials
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Step 4: Allow cashiers to read orders (same as admin)
-- We need to add a policy for cashiers on the orders table
CREATE POLICY "Cashiers can read orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'cashier'
    )
  );

-- Allow cashiers to update orders (for status changes)
CREATE POLICY "Cashiers can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'cashier'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'cashier'
    )
  );

-- Allow cashiers to read order items
CREATE POLICY "Cashiers can read order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'cashier'
    )
  );

-- Allow cashiers to read profiles (for customer info on orders)
CREATE POLICY "Cashiers can read profiles for orders"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'cashier')
    )
  );

-- Allow cashiers to read menu items
CREATE POLICY "Cashiers can read menu items"
  ON menu_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'cashier'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cashier_credentials_profile_id ON cashier_credentials(profile_id);
CREATE INDEX IF NOT EXISTS idx_cashier_credentials_id_number ON cashier_credentials(id_number);
CREATE INDEX IF NOT EXISTS idx_cashier_credentials_created_by ON cashier_credentials(created_by);
