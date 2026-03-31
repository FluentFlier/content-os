'use client';

import { useCallback, useEffect, useState } from 'react';
import { Film, Trash2, Wand2, Loader2 } from 'lucide-react';
import { getInsforgeClient } from '@/lib/insforge/client';
import {
  VideoUploader,
  VideoPlayer,
  TemplateSelector,
  ExportPanel,
  RemotionPreview,
} from '@/components/video-studio';
import type { TemplateId } from '@/components/video-studio';
import type { CaptionWord } from '@/components/video-studio/compositions';

interface VideoFile {
  name: string;
  url: string;
  created_at: string;
}

export default function VideoStudioPage() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [activeVideo, setActiveVideo] = useState<VideoFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | undefined>();
  const [showPreview, setShowPreview] = useState(false);

  // Auto-edit state
  const [autoEditing, setAutoEditing] = useState(false);
  const [autoEditResult, setAutoEditResult] = useState<string | null>(null);
  const [captions, setCaptions] = useState<CaptionWord[]>([]);

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
        const pathInBucket = `${uid}/${video.name}`;
        await client.storage.from('videos').remove(pathInBucket);

        setVideos((prev) => prev.filter((v) => v.name !== video.name));
        if (activeVideo?.name === video.name) {
          setActiveVideo(null);
          setSelectedTemplate(undefined);
          setShowPreview(false);
        }
      } catch (err) {
        console.error('Failed to delete video', err);
      }
    },
    [activeVideo],
  );

  const handleAutoEdit = async () => {
    if (!activeVideo) return;
    setAutoEditing(true);
    setAutoEditResult(null);

    try {
      const res = await fetch('/api/video/auto-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: activeVideo.url,
          options: { captions: true, silenceRemoval: true, smartCuts: true },
        }),
      });

      const data = await res.json();
      if (data.captions) {
        setCaptions(data.captions);
      }
      setAutoEditResult(data.message || 'Processing submitted');
    } catch (err) {
      setAutoEditResult('Auto-edit request failed');
    } finally {
      setAutoEditing(false);
    }
  };

  const handleTemplateSelect = (id: TemplateId) => {
    setSelectedTemplate(id);
    setShowPreview(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 bg-[#18181B] rounded-md animate-pulse" />
        </div>
        <div className="h-64 bg-[#18181B] rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-[#18181B] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-[22px] font-[800] text-[#FAFAFA] leading-[1.2] tracking-[-0.02em]">
          Video Studio
        </h1>
        <p className="font-body text-[13px] text-[#71717A] mt-1">
          Upload, apply templates, and export your videos with Remotion-powered compositions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main column */}
        <div className="space-y-6">
          {/* Upload zone */}
          <VideoUploader onUploadComplete={handleUploadComplete} />

          {/* Active video player or Remotion preview */}
          {activeVideo && (
            <>
              {showPreview && selectedTemplate ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-[15px] font-[700] text-[#FAFAFA]">
                      Template Preview
                    </h3>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="font-body text-[12px] text-[#6366F1] hover:underline"
                    >
                      Back to video
                    </button>
                  </div>
                  <RemotionPreview
                    videoSrc={activeVideo.url}
                    templateId={selectedTemplate}
                    captions={captions.length > 0 ? captions : undefined}
                  />
                </div>
              ) : (
                <VideoPlayer src={activeVideo.url} title={activeVideo.name} />
              )}

              {/* Auto-edit button */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleAutoEdit}
                  disabled={autoEditing}
                  className="flex items-center gap-1.5 bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 text-[#FAFAFA] text-[13px] font-medium px-5 py-[10px] min-h-[44px] rounded-[7px] hover:border-[#FAFAFA]/25 transition-colors disabled:opacity-50"
                >
                  {autoEditing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  {autoEditing ? 'Processing...' : 'Auto-Edit (Captions + Cuts)'}
                </button>
                {autoEditResult && (
                  <span className="font-body text-[11px] text-[#71717A]">{autoEditResult}</span>
                )}
              </div>
            </>
          )}

          {/* Template selector */}
          <TemplateSelector
            selected={selectedTemplate}
            onSelect={handleTemplateSelect}
            hasVideo={Boolean(activeVideo)}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Export panel */}
          <ExportPanel
            videoSrc={activeVideo?.url}
            templateId={selectedTemplate}
          />

          {/* Video list */}
          <div className="space-y-3">
            <h3 className="font-heading text-[15px] font-[700] text-[#FAFAFA]">
              Your Videos
            </h3>
            {videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center rounded-lg bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12">
                <Film className="w-8 h-8 text-[#71717A] mb-2" />
                <p className="font-body text-[13px] text-[#71717A]">
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
                          ? 'bg-[rgba(99,102,241,0.12)] border-[0.5px] border-[#6366F1]/30'
                          : 'bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 hover:border-[#FAFAFA]/25'
                      }`}
                      onClick={() => {
                        setActiveVideo(video);
                        setShowPreview(false);
                      }}
                    >
                      <Film
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? 'text-[#6366F1]' : 'text-[#71717A]'
                        }`}
                      />
                      <span
                        className={`font-body text-[13px] truncate flex-1 ${
                          isActive ? 'text-[#6366F1] font-medium' : 'text-[#FAFAFA]'
                        }`}
                      >
                        {video.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(video);
                        }}
                        className="text-[#71717A] hover:text-[#6366F1] transition-colors flex-shrink-0"
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
