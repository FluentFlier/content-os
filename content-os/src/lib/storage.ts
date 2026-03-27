import { getInsforge } from "./insforge/client";

const MEDIA_BUCKET = "media";

export async function uploadMedia(
  userId: string,
  file: File,
  postId?: string
): Promise<{ path: string; url: string; id: string }> {
  const insforge = getInsforge();

  // Upload to InsForge Storage
  const ext = file.name.split(".").pop() || "bin";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await insforge.storage
    .from(MEDIA_BUCKET)
    .upload(path, file);

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  // Get public URL
  const urlResult = insforge.storage
    .from(MEDIA_BUCKET)
    .getPublicUrl(path) as unknown as { data: { publicUrl: string } };

  // Save to media_attachments table
  const { data, error } = await insforge.database
    .from("media_attachments")
    .insert({
      user_id: userId,
      post_id: postId || null,
      bucket_path: path,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save attachment: ${error.message}`);

  return { path, url: urlResult.data.publicUrl, id: data.id };
}

export async function deleteMedia(
  userId: string,
  attachmentId: string,
  bucketPath: string
): Promise<void> {
  const insforge = getInsforge();

  // Delete from storage
  await insforge.storage.from(MEDIA_BUCKET).remove(bucketPath);

  // Delete record
  await insforge.database
    .from("media_attachments")
    .delete()
    .eq("id", attachmentId)
    .eq("user_id", userId);
}

export async function getPostMedia(userId: string, postId: string) {
  const insforge = getInsforge();
  const { data } = await insforge.database
    .from("media_attachments")
    .select("*")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  return (data || []).map((att: Record<string, string>) => ({
    ...att,
    url: (insforge.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(att.bucket_path) as unknown as { data: { publicUrl: string } }).data.publicUrl,
  }));
}
