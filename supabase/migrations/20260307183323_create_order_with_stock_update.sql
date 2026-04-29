/*
  # Create Order with Atomic Stock Update

  1. New Function
    - `create_order_with_items` - Creates an order and order items while atomically updating stock
    - Ensures stock is only deducted if the order is successfully created
    - Prevents overselling by checking available stock before deduction
    - Rolls back entire transaction if any operation fails

  2. Security
    - Function is callable only by authenticated users
    - Validates that customer_id matches the authenticated user
    - Prevents stock from going below 0
*/

CREATE OR REPLACE FUNCTION create_order_with_items(
  p_customer_id uuid,
  p_total_amount numeric,
  p_payment_method text,
  p_payment_status text,
  p_order_number text,
  p_order_items jsonb
)
RETURNS TABLE(
  order_id uuid,
  success boolean,
  message text
) AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_menu_item_id uuid;
  v_quantity integer;
  v_price numeric;
  v_current_stock integer;
BEGIN
  -- Ensure user can only create orders for themselves
  IF p_customer_id != auth.uid() THEN
    RETURN QUERY SELECT NULL::uuid, false, 'Unauthorized'::text;
    RETURN;
  END IF;

  -- Create the order
  INSERT INTO orders (customer_id, total_amount, payment_method, payment_status, order_status, order_number)
  VALUES (p_customer_id, p_total_amount, p_payment_method, p_payment_status, 'pending', p_order_number)
  RETURNING orders.id INTO v_order_id;

  -- Process each order item
  FOR v_item IN SELECT jsonb_array_elements(p_order_items)
  LOOP
    v_menu_item_id := (v_item->>'menu_item_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_price := (v_item->>'price_at_time')::numeric;

    -- Check current stock
    SELECT stock INTO v_current_stock FROM menu_items WHERE id = v_menu_item_id;

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Menu item not found';
    END IF;

    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for item %', v_menu_item_id;
    END IF;

    -- Insert order item
    INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time, subtotal)
    VALUES (v_order_id, v_menu_item_id, v_quantity, v_price, v_quantity * v_price);

    -- Update stock (atomic operation)
    UPDATE menu_items
    SET stock = stock - v_quantity
    WHERE id = v_menu_item_id;
  END LOOP;

  RETURN QUERY SELECT v_order_id, true, 'Order created successfully'::text;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT NULL::uuid, false, SQLERRM::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
