"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Film, Upload, X } from "lucide-react";
import { uploadMedia, deleteMedia, getPostMedia } from "@/lib/storage";
import type { MediaAttachment } from "@/types/database";

type MediaWithUrl = MediaAttachment & { url: string };

interface MediaUploadProps {
  userId: string;
  postId?: string;
  onUpload?: (media: MediaWithUrl) => void;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function isVideoType(type: string) {
  return type.startsWith("video/");
}

export default function MediaUpload({
  userId,
  postId,
  onUpload,
}: MediaUploadProps) {
  const [media, setMedia] = useState<MediaWithUrl[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load existing media for the post
  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    getPostMedia(userId, postId).then((items) => {
      if (!cancelled) setMedia(items as MediaWithUrl[]);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, postId]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          setError(
            `Unsupported file type: ${file.name}. Accepted: jpg, png, gif, webp, mp4, mov.`
          );
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`File too large: ${file.name}. Maximum size is 50 MB.`);
          continue;
        }

        setUploading(true);
        try {
          const result = await uploadMedia(userId, file, postId);
          const newMedia: MediaWithUrl = {
            id: result.id,
            user_id: userId,
            post_id: postId || null,
            bucket_path: result.path,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            url: result.url,
            created_at: new Date().toISOString(),
          };
          setMedia((prev) => [...prev, newMedia]);
          onUpload?.(newMedia);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Upload failed. Please try again."
          );
        } finally {
          setUploading(false);
        }
      }
    },
    [userId, postId, onUpload]
  );

  const handleDelete = async (attachment: MediaWithUrl) => {
    try {
      await deleteMedia(userId, attachment.id, attachment.bucket_path);
      setMedia((prev) => prev.filter((m) => m.id !== attachment.id));
    } catch (err) {
      console.error("Failed to delete media", err);
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-coral bg-coral/5"
            : "border-border hover:border-text-muted"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-coral border-t-transparent animate-spin" />
            <span className="text-xs text-text-muted">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-5 h-5 text-text-muted" />
            <span className="text-xs text-text-muted">
              Drop files here or click to browse
            </span>
            <span className="text-[10px] text-text-muted">
              Images (jpg, png, gif, webp) or videos (mp4, mov) up to 50 MB
            </span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.mov"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Thumbnails grid */}
      {media.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {media.map((item) => (
            <div
              key={item.id}
              className="relative w-20 h-20 rounded overflow-hidden bg-bg border border-border group"
            >
              {isVideoType(item.file_type) ? (
                <div className="w-full h-full flex items-center justify-center bg-bg">
                  <Film className="w-6 h-6 text-text-muted" />
                </div>
              ) : (
                <Image
                  src={item.url}
                  alt={item.file_name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item);
                }}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
