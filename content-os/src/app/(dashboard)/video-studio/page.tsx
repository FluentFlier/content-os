'use client';

import { useCallback, useEffect, useState } from 'react';
import { Film, Trash2 } from 'lucide-react';
import { getInsforgeClient } from '@/lib/insforge/client';
import {
  VideoUploader,
  VideoPlayer,
  TemplateSelector,
  ExportPanel,
} from '@/components/video-studio';

interface VideoFile {
  name: string;
  url: string;
  created_at: string;
}

export default function VideoStudioPage() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [activeVideo, setActiveVideo] = useState<VideoFile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVideos = useCallback(async () => {
    try {
      const client = getInsforgeClient();
      const { data: userData } = await client.auth.getCurrentUser();
      if (!userData?.user) return;

      const uid = userData.user.id;
      const { data: files, error } = await client.storage
        .from('videos')
        .list({ prefix: uid + '/' });

      if (error || !files) return;

      const objects = files.objects ?? [];
      if (objects.length === 0) return;

      const videoFiles: VideoFile[] = objects.map((f) => {
        const fileName = f.key.split('/').pop() ?? f.key;
        return {
          name: fileName,
          url: f.url || client.storage.from('videos').getPublicUrl(f.key),
          created_at: f.uploadedAt ?? '',
        };
      });

      setVideos(videoFiles);
      if (!activeVideo && videoFiles.length > 0) {
        setActiveVideo(videoFiles[0]);
      }
    } catch (err) {
      console.error('Failed to fetch videos', err);
    } finally {
      setLoading(false);
    }
  }, [activeVideo]);

  useEffect(() => {
    fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUploadComplete = useCallback(
    (url: string, fileName: string) => {
      const newVideo: VideoFile = {
        name: fileName,
        url,
        created_at: new Date().toISOString(),
      };
      setVideos((prev) => [newVideo, ...prev]);
      setActiveVideo(newVideo);
    },
    [],
  );

  const handleDelete = useCallback(
    async (video: VideoFile) => {
      if (!confirm(`Delete "${video.name}"?`)) return;
      try {
        const client = getInsforgeClient();
        const { data: userData } = await client.auth.getCurrentUser();
        if (!userData?.user) return;

        const uid = userData.user.id;
        // The stored path is uid/filename
        const pathInBucket = `${uid}/${video.name}`;
        await client.storage.from('videos').remove(pathInBucket);

        setVideos((prev) => prev.filter((v) => v.name !== video.name));
        if (activeVideo?.name === video.name) {
          setActiveVideo(null);
        }
      } catch (err) {
        console.error('Failed to delete video', err);
      }
    },
    [activeVideo],
  );

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 bg-[#F4F2EF] rounded-md animate-pulse" />
        </div>
        <div className="h-64 bg-[#F4F2EF] rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-[#F4F2EF] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-[22px] font-[800] text-[#1A1714] leading-[1.2] tracking-[-0.02em]">
          Video Studio
        </h1>
        <p className="font-body text-[13px] text-[#8C857D] mt-1">
          Upload, preview, and prepare your videos for editing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main column */}
        <div className="space-y-6">
          {/* Upload zone */}
          <VideoUploader onUploadComplete={handleUploadComplete} />

          {/* Active video player */}
          {activeVideo && (
            <VideoPlayer src={activeVideo.url} title={activeVideo.name} />
          )}

          {/* Template selector */}
          <TemplateSelector />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Export panel */}
          <ExportPanel />

          {/* Video list */}
          <div className="space-y-3">
            <h3 className="font-heading text-[15px] font-[700] text-[#1A1714]">
              Your Videos
            </h3>
            {videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center rounded-lg bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12">
                <Film className="w-8 h-8 text-[#8C857D] mb-2" />
                <p className="font-body text-[13px] text-[#8C857D]">
                  No videos yet. Upload one above.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {videos.map((video) => {
                  const isActive = activeVideo?.name === video.name;
                  return (
                    <div
                      key={video.name}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-100 ${
                        isActive
                          ? 'bg-[#FAECE7] border-[0.5px] border-[#EB5E55]/30'
                          : 'bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 hover:border-[#1A1714]/25'
                      }`}
                      onClick={() => setActiveVideo(video)}
                    >
                      <Film
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? 'text-[#EB5E55]' : 'text-[#8C857D]'
                        }`}
                      />
                      <span
                        className={`font-body text-[13px] truncate flex-1 ${
                          isActive
                            ? 'text-[#EB5E55] font-medium'
                            : 'text-[#1A1714]'
                        }`}
                      >
                        {video.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(video);
                        }}
                        className="text-[#8C857D] hover:text-[#EB5E55] transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
