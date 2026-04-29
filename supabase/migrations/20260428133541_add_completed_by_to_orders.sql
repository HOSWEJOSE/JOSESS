/*
  # Add completed_by column to orders table

  1. Modified Tables
    - `orders`
      - `completed_by` (uuid, nullable) - References the cashier who completed the order
      - Foreign key to auth.users(id)

  2. Security
    - No RLS changes needed, existing policies cover the new column

  3. Important Notes
    - This allows tracking which cashier completed each order
    - Enables per-cashier income reporting
    - Existing orders will have NULL for completed_by (completed before this feature)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'completed_by'
  ) THEN
    ALTER TABLE orders ADD COLUMN completed_by uuid REFERENCES auth.users(id);
  END IF;
END $$;
