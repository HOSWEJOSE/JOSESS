/*
  # Fix Security and Performance Issues

  1. Add Missing Indexes
    - Index on `order_items.order_id` for FK
    - Index on `order_items.menu_item_id` for FK
    - Index on `orders.customer_id` for FK
  
  2. Optimize RLS Policies
    - Replace `auth.uid()` with `(select auth.uid())` in all policies
    - This prevents re-evaluation of auth functions for each row
  
  3. Update Function Search Paths
    - Set search_path to IMMUTABLE for security functions
*/

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Drop old RLS policies and recreate with optimized auth function calls
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Admin can update any profile" ON profiles;
CREATE POLICY "Admin can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- Menu Items policies
DROP POLICY IF EXISTS "Admins can insert menu items" ON menu_items;
CREATE POLICY "Admins can insert menu items"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update menu items" ON menu_items;
CREATE POLICY "Admins can update menu items"
  ON menu_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete menu items" ON menu_items;
CREATE POLICY "Admins can delete menu items"
  ON menu_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- Orders policies
DROP POLICY IF EXISTS "Customers can read own orders" ON orders;
CREATE POLICY "Customers can read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (customer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can read all orders" ON orders;
CREATE POLICY "Admins can read all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Customers can create own orders" ON orders;
CREATE POLICY "Customers can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- Order Items policies
DROP POLICY IF EXISTS "Users can read order items for their orders" ON order_items;
CREATE POLICY "Users can read order items for their orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can read all order items" ON order_items;
CREATE POLICY "Admins can read all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can insert order items for their orders" ON order_items;
CREATE POLICY "Users can insert order items for their orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = (select auth.uid())
    )
  );

-- Update function search paths to IMMUTABLE
ALTER FUNCTION public.update_updated_at_column() IMMUTABLE;
ALTER FUNCTION public.generate_order_number() IMMUTABLE;
ALTER FUNCTION public.make_user_admin(TEXT) IMMUTABLE;
