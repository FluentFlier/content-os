'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  imageUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
}

export function ImageUpload({ imageUrl, onUpload, onRemove }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return;
      }

      onUpload(data.url);
    } catch {
      setError('Upload failed. Check your connection.');
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  if (imageUrl) {
    return (
      <div className="relative group">
        <img
          src={imageUrl}
          alt="Post media"
          className="w-full max-h-[200px] object-cover rounded-[7px] border-[0.5px] border-[rgba(255,255,255,0.12)]"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#09090B]/80 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        disabled={uploading}
        className={`w-full flex flex-col items-center justify-center gap-2 py-6 rounded-[7px] border border-dashed transition-all ${
          dragOver
            ? 'border-[#818CF8] bg-[rgba(129,140,248,0.08)]'
            : 'border-[rgba(255,255,255,0.12)] bg-[#18181B] hover:border-[rgba(255,255,255,0.25)]'
        } ${uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {uploading ? (
          <Loader2 size={20} className="text-[#71717A] animate-spin" />
        ) : (
          <ImageIcon size={20} className="text-[#52525B]" />
        )}
        <span className="text-[12px] text-[#71717A]">
          {uploading ? 'Uploading...' : 'Drop image or click to upload'}
        </span>
        <span className="text-[10px] text-[#52525B]">JPG, PNG, WebP, GIF. Max 10MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleSelect}
        className="hidden"
      />
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}
