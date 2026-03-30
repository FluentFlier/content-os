'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, CheckCircle } from 'lucide-react';
import { getInsforgeClient } from '@/lib/insforge/client';

interface VideoUploaderProps {
  onUploadComplete: (url: string, fileName: string) => void;
}

export default function VideoUploader({ onUploadComplete }: VideoUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);
      setFileName(file.name);
      setUploading(true);
      setProgress(0);

      try {
        const client = getInsforgeClient();
        const { data: userData } = await client.auth.getCurrentUser();
        if (!userData?.user) {
          throw new Error('Not authenticated');
        }

        const uid = userData.user.id;
        const ext = file.name.split('.').pop() ?? 'mp4';
        const path = `${uid}/${Date.now()}.${ext}`;

        // Simulate progress since the SDK upload doesn't expose progress
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const { data, error: uploadError } = await client.storage
          .from('videos')
          .upload(path, file);

        clearInterval(progressInterval);

        if (uploadError) throw uploadError;

        setProgress(100);

        const publicUrl = data?.url
          ?? client.storage.from('videos').getPublicUrl(data?.key ?? path);

        onUploadComplete(publicUrl, file.name);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(message);
      } finally {
        setUploading(false);
      }
    },
    [onUploadComplete],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('video/')) {
        uploadFile(file);
      } else {
        setError('Please drop a video file.');
      }
    },
    [uploadFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile],
  );

  const reset = () => {
    setProgress(0);
    setError(null);
    setFileName(null);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-[1.5px] border-dashed p-10 cursor-pointer transition-all duration-150 ${
          dragOver
            ? 'border-[#6366F1] bg-[#EEF2FF]'
            : 'border-[#0F172A]/12 bg-[#F8FAFC] hover:border-[#0F172A]/25'
        } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {uploading ? (
          <>
            <div className="w-12 h-12 rounded-full border-[3px] border-[#F8FAFC] border-t-[#6366F1] animate-spin" />
            <p className="font-body text-[13px] text-[#475569]">
              Uploading {fileName}...
            </p>
            <div className="w-full max-w-xs h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6366F1] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-body text-[11px] text-[#94A3B8]">
              {progress}%
            </span>
          </>
        ) : progress === 100 ? (
          <>
            <CheckCircle className="w-10 h-10 text-[#10B981]" />
            <p className="font-body text-[13px] text-[#475569]">
              {fileName} uploaded successfully
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              className="font-body text-[12px] text-[#6366F1] hover:underline"
            >
              Upload another
            </button>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-[#94A3B8]" />
            <div className="text-center">
              <p className="font-body text-[13px] text-[#0F172A] font-medium">
                Drag and drop a video file here
              </p>
              <p className="font-body text-[12px] text-[#94A3B8] mt-1">
                or click to browse. MP4, MOV, WebM accepted.
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-[#EEF2FF] border-[0.5px] border-[#6366F1]/20 rounded-md px-3 py-2">
          <X className="w-4 h-4 text-[#6366F1] flex-shrink-0" />
          <p className="font-body text-[12px] text-[#4338CA]">{error}</p>
        </div>
      )}
    </div>
  );
}
