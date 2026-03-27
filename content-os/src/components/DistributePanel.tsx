"use client";

import { useState } from "react";
import {
  Send,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Twitter,
  Linkedin,
  Instagram,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Post } from "@/types/database";

interface DistributePanelProps {
  post: Post;
}

type PlatformStatus = "draft" | "optimizing" | "posting" | "posted" | "failed" | "copied";

interface PlatformState {
  caption: string;
  status: PlatformStatus;
  error?: string;
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  twitter: <Twitter className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
};

const STATUS_STYLES: Record<PlatformStatus, string> = {
  draft: "text-text-muted",
  optimizing: "text-yellow",
  posting: "text-blue",
  posted: "text-green",
  failed: "text-coral",
  copied: "text-green",
};

export default function DistributePanel({ post }: DistributePanelProps) {
  const [open, setOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [platformStates, setPlatformStates] = useState<Record<string, PlatformState>>({
    instagram: { caption: post.caption ?? "", status: "draft" },
    twitter: { caption: post.caption ?? "", status: "draft" },
    linkedin: { caption: post.caption ?? "", status: "draft" },
  });

  const updatePlatform = (platform: string, updates: Partial<PlatformState>) => {
    setPlatformStates((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], ...updates },
    }));
  };

  const handleOptimizeAll = async () => {
    setOptimizing(true);
    const platforms = ["instagram", "twitter", "linkedin"];
    platforms.forEach((p) => updatePlatform(p, { status: "optimizing" }));

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          script: post.script ?? "",
          caption: post.caption ?? "",
          platforms,
        }),
      });

      if (!res.ok) throw new Error("Optimization failed");

      const { results } = await res.json();
      for (const platform of platforms) {
        if (results[platform]) {
          updatePlatform(platform, {
            caption: results[platform],
            status: "draft",
          });
        } else {
          updatePlatform(platform, { status: "draft" });
        }
      }
    } catch (err) {
      platforms.forEach((p) =>
        updatePlatform(p, {
          status: "failed",
          error: err instanceof Error ? err.message : "Failed",
        })
      );
    } finally {
      setOptimizing(false);
    }
  };

  const handlePost = async (platform: string) => {
    updatePlatform(platform, { status: "posting" });

    try {
      const res = await fetch("/api/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          platforms: {
            [platform]: { caption: platformStates[platform].caption },
          },
        }),
      });

      if (!res.ok) throw new Error("Distribution failed");

      const { results } = await res.json();
      const result = results[platform];

      if (result?.success) {
        updatePlatform(platform, { status: "posted" });
      } else {
        updatePlatform(platform, {
          status: "failed",
          error: result?.error ?? "Unknown error",
        });
      }
    } catch (err) {
      updatePlatform(platform, {
        status: "failed",
        error: err instanceof Error ? err.message : "Failed",
      });
    }
  };

  const handleCopy = async (platform: string) => {
    await navigator.clipboard.writeText(platformStates[platform].caption);
    updatePlatform(platform, { status: "copied" });
    setTimeout(() => updatePlatform(platform, { status: "draft" }), 2000);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 border border-border text-text-primary text-sm px-3 py-2 rounded hover:bg-bg transition-colors"
      >
        <Send className="w-4 h-4" />
        Distribute
      </button>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg mt-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-text-primary">
          Cross-Platform Distribution
        </h3>
        <button
          onClick={() => setOpen(false)}
          className="p-1 rounded hover:bg-bg text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Optimize All */}
      <div className="px-4 py-3 border-b border-border">
        <button
          onClick={handleOptimizeAll}
          disabled={optimizing}
          className="flex items-center gap-1.5 bg-coral text-white text-sm font-medium px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${optimizing ? "animate-spin" : ""}`} />
          {optimizing ? "Optimizing..." : "Optimize for All Platforms"}
        </button>
      </div>

      {/* Platform sections */}
      {["instagram", "twitter", "linkedin"].map((platform) => {
        const state = platformStates[platform];
        const charCount = state.caption.length;
        const isTwitter = platform === "twitter";
        const isOverLimit = isTwitter && charCount > 280;
        const isThread = isTwitter && charCount > 280;

        return (
          <div key={platform} className="px-4 py-3 border-b border-border last:border-b-0">
            {/* Platform header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {PLATFORM_ICONS[platform]}
                <span className="text-sm font-medium text-text-primary">
                  {PLATFORM_LABELS[platform]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Status */}
                <span className={`text-xs capitalize ${STATUS_STYLES[state.status]}`}>
                  {state.status === "copied" ? "Copied!" : state.status}
                </span>
                {/* Character count */}
                <span
                  className={`text-xs ${
                    isTwitter && isOverLimit ? "text-coral" : "text-text-muted"
                  }`}
                >
                  {charCount}
                  {isTwitter && " / 280"}
                </span>
              </div>
            </div>

            {/* Thread indicator */}
            {isThread && (
              <div className="text-xs text-yellow mb-2">
                Will be posted as a thread ({Math.ceil(charCount / 280)} tweets)
              </div>
            )}

            {/* Caption textarea */}
            <textarea
              value={state.caption}
              onChange={(e) => updatePlatform(platform, { caption: e.target.value })}
              rows={3}
              className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-coral resize-none mb-2"
              placeholder={`Optimized ${PLATFORM_LABELS[platform]} caption...`}
            />

            {/* Error message */}
            {state.status === "failed" && state.error && (
              <div className="flex items-center gap-1 text-xs text-coral mb-2">
                <AlertCircle className="w-3 h-3" />
                {state.error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              {platform === "instagram" ? (
                <button
                  onClick={() => handleCopy(platform)}
                  className="flex items-center gap-1 text-xs border border-border text-text-primary px-3 py-1.5 rounded hover:bg-bg transition-colors"
                >
                  {state.status === "copied" ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {state.status === "copied" ? "Copied!" : "Copy Caption"}
                </button>
              ) : (
                <button
                  onClick={() => handlePost(platform)}
                  disabled={
                    state.status === "posting" ||
                    state.status === "posted" ||
                    !state.caption
                  }
                  className="flex items-center gap-1 text-xs bg-coral text-white px-3 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {state.status === "posting" ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : state.status === "posted" ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  {state.status === "posting"
                    ? "Posting..."
                    : state.status === "posted"
                    ? "Posted"
                    : "Post"}
                </button>
              )}
              <button
                onClick={() => handleCopy(platform)}
                className="flex items-center gap-1 text-xs border border-border text-text-muted px-3 py-1.5 rounded hover:bg-bg transition-colors"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
