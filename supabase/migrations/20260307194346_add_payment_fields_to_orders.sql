/*
  # Add Payment Fields to Orders Table

  1. Changes
    - Add `payment_url` column to store the payment gateway URL
    - Add `payment_reference` column to store the transaction reference from payment provider
    - Add `payment_completed_at` column to track when payment was completed

  2. Security
    - No RLS changes needed as orders table already has proper policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_reference'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_reference text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_completed_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_completed_at timestamptz;
  END IF;
END $$;