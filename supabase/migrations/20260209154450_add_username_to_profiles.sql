/*
  # Add username column to profiles table

  1. Modified Tables
    - `profiles`
      - Add `username` column (text, unique, not null)

  This allows admins to log in with username and password instead of email and password.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN username text UNIQUE;
  END IF;
END $$;