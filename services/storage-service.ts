import { supabase } from '@/lib/supabase';

export type StorageBucket = 'avatars' | 'products';

interface UploadOptions {
  bucket: StorageBucket;
  path: string;
  file: Blob | ArrayBuffer;
  contentType?: string;
  upsert?: boolean;
}

interface UploadResult {
  url: string | null;
  error: Error | null;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { bucket, path, file, contentType, upsert = true } = options;

  try {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Upload error:', error);
    return { url: null, error: error as Error };
  }
}

/**
 * Upload an image from a local URI
 */
export async function uploadImageFromUri(
  uri: string,
  bucket: StorageBucket,
  fileName: string
): Promise<UploadResult> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileExt = uri.split('.').pop() || 'jpg';
    const path = `${fileName}.${fileExt}`;

    return uploadFile({
      bucket,
      path,
      file: blob,
      contentType: `image/${fileExt}`,
    });
  } catch (error) {
    console.error('Upload from URI error:', error);
    return { url: null, error: error as Error };
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(bucket: StorageBucket, path: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Delete error:', error);
    return { error: error as Error };
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}
