/*
  # Create Staff Logs Table

  ## Summary
  Tracks who logs into the admin panel by recording staff names alongside the
  authenticated admin's profile. Each login session requires the staff member to
  provide their name, which gets stored with a timestamp.

  ## New Tables
  - `staff_logs`
    - `id` (uuid, primary key)
    - `admin_id` (uuid, FK to profiles.id) - the authenticated admin account used
    - `staff_name` (text) - the name entered by the staff member
    - `admin_username` (text) - username of the admin account for quick display
    - `logged_in_at` (timestamptz) - when the login+name entry occurred

  ## Security
  - RLS enabled on `staff_logs`
  - Admins can insert their own logs
  - Admins can read all logs (for the Staff Logs view)
*/

CREATE TABLE IF NOT EXISTS staff_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  staff_name text NOT NULL,
  admin_username text NOT NULL DEFAULT '',
  logged_in_at timestamptz DEFAULT now(),

  CONSTRAINT fk_staff_logs_admin
    FOREIGN KEY (admin_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE
);

ALTER TABLE staff_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert staff logs"
  ON staff_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = admin_id);

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

CREATE INDEX IF NOT EXISTS idx_staff_logs_admin_id ON staff_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_staff_logs_logged_in_at ON staff_logs(logged_in_at DESC);
