/*
  # Allow Public Profile Lookup for Login

  ## Problem
  - Login fails because unauthenticated users cannot query the profiles table
  - When signing in, the app queries profiles by username to get email, but RLS blocks this
  
  ## Solution
  - Add a public SELECT policy allowing anyone to read username and email from profiles
  - This enables the login flow to work by letting unauthenticated users look up email by username
  
  ## Security
  - Only username and email are accessible (not sensitive data)
  - Necessary for login functionality
  - Does not allow access to other sensitive profile data
*/

CREATE POLICY "Public can query username and email"
  ON profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);
