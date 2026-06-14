-- Supabase Storage: listing photos
-- Run after 001_initial_schema.sql

-- Create the bucket (public — photos are always viewable)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-photos',
  'listing-photos',
  true,
  5242880,  -- 5 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS on storage.objects
-- Authenticated users can upload to their own folder (userId/filename)
CREATE POLICY "Users can upload their own listing photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-photos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Anyone can read (bucket is public but belt-and-suspenders)
CREATE POLICY "Listing photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-photos');

-- Users can delete their own photos
CREATE POLICY "Users can delete their own listing photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listing-photos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );
