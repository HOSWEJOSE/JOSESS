/*
  # Add Role Column to Staff Logs

  ## Summary
  Extends the staff_logs table to track both admin and cashier logins.
  Previously, staff_logs only recorded admin panel access. Now cashier
  logins will also be logged, with a role column to distinguish them.

  ## Modified Tables
  - `staff_logs`
    - Added `role` column (text, default 'admin') - identifies whether
      the log entry is from an 'admin' or 'cashier' login
    - Added `cashier_username` column (text, default '') - stores the
      cashier's username for display (analogous to admin_username)

  ## Security
  - Updated INSERT policy: cashiers can also insert their own logs
  - Updated SELECT policy: cashiers can read their own logs (admins can still read all)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staff_logs' AND column_name = 'role'
  ) THEN
    ALTER TABLE staff_logs ADD COLUMN role text NOT NULL DEFAULT 'admin';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staff_logs' AND column_name = 'cashier_username'
  ) THEN
    ALTER TABLE staff_logs ADD COLUMN cashier_username text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Drop old policies to replace with updated ones
DROP POLICY IF EXISTS "Admins can insert staff logs" ON staff_logs;
DROP POLICY IF EXISTS "Admins can read all staff logs" ON staff_logs;

-- New INSERT policy: admins and cashiers can insert their own logs
CREATE POLICY "Users can insert own staff logs"
  ON staff_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = admin_id);

-- New SELECT policy: admins can read all, cashiers can read their own
CREATE POLICY "Admins can read all staff logs"
  ON staff_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Cashiers can read own staff logs"
  ON staff_logs
  FOR SELECT
  TO authenticated
  USING (
    role = 'cashier'
    AND admin_id = auth.uid()
  );
