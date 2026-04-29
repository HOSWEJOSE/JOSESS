/*
  # Add admin read cashiers policy

  1. Security
    - Add SELECT policy for admins to read cashier profiles
    - This allows the CashierAccount management page to list all cashiers
*/

CREATE POLICY "Admin can read cashier profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    get_user_role(auth.uid()) = 'admin'
  );
