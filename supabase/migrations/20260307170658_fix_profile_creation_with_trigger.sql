/*
  # Fix Profile Creation with Database Trigger

  ## Problem
  - Users cannot login after signup because profiles are not being created
  - RLS policies require authenticated users, but profile creation happens during signup
  
  ## Solution
  1. Create a database trigger that automatically creates profiles when users sign up
  2. Update RLS policies to allow the trigger to work properly
  3. Add a function to handle new user registration
  
  ## Changes
  - Add trigger function `handle_new_user()` that creates profile automatically
  - Add trigger `on_auth_user_created` that fires when a new user is created
  - Update RLS policies to allow service role to insert profiles
  
  ## Security
  - Trigger runs with security definer privileges
  - Only creates profile once per user
  - Maintains existing RLS policies for user access
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add policy to allow service role to insert profiles
CREATE POLICY "Service role can insert profiles"
  ON profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Add policy to allow authenticated users to insert their own profile (backup)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
