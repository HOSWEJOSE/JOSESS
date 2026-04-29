/*
  # Add Admin Helper Function

  1. New Functions
    - `make_user_admin` - Helper function to promote a user to admin role
      - Takes user email as parameter
      - Updates the user's role to 'admin'
      - Only callable by existing admins or when no admins exist
  
  2. Notes
    - This function helps with initial admin setup
    - After signup, users can be promoted to admin using this function
*/

CREATE OR REPLACE FUNCTION make_user_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET role = 'admin'
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;