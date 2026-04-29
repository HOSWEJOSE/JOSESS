/*
  # Create Menu Images Storage Bucket

  1. New Storage Bucket
    - `menu-images` bucket for storing menu item images
    
  2. Storage Policies
    - Public read access for images
    - Authenticated users can upload images
    - Only admins can delete images
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public access to menu images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can upload menu images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'menu-images' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete menu images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'menu-images' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
