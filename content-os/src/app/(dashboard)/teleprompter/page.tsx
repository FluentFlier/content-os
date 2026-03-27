"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getInsforge } from "@/lib/insforge/client";

function TeleprompterContent() {
  const searchParams = useSearchParams();
  const postId = searchParams.get("postId");

  const [script, setScript] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(5);
  const [fontSize, setFontSize] = useState(32);
  const [mirrored, setMirrored] = useState(false);
  const [progress, setProgress] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showPaused, setShowPaused] = useState(false);
  const [loading, setLoading] = useState(!!postId);

  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load script from post if postId is provided
  useEffect(() => {
    if (!postId) return;

    async function loadPost() {
      try {
        const insforge = getInsforge();
        const { data: userData } = await insforge.auth.getCurrentUser();
        if (!userData?.user?.id) {
          setLoading(false);
          return;
        }
        const { data: post } = await insforge.database
          .from("posts")
          .select("script, title")
          .eq("id", postId)
          .eq("user_id", userData.user.id)
          .single();
        if (post?.script) {
          setScript(post.script);
          setIsActive(true);
        }
      } catch {
        // If loading fails, fall back to manual mode
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [postId]);

  // Calculate initial font size based on script length
  useEffect(() => {
    if (!script) return;
    const len = script.length;
    if (len < 500) setFontSize(36);
    else if (len < 1500) setFontSize(32);
    else if (len < 3000) setFontSize(30);
    else setFontSize(28);
  }, [script]);

  // Auto-scroll
  useEffect(() => {
    if (!isPlaying || !isActive) return;
    const pixelsPerFrame = speed * 0.5;
    const interval = setInterval(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop += pixelsPerFrame;
      }
    }, 16);
    return () => clearInterval(interval);
  }, [isPlaying, speed, isActive]);

  // Track scroll progress
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isActive) return;

    function onScroll() {
      if (!el) return;
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) {
        setProgress(100);
        return;
      }
      setProgress(Math.min(100, (el.scrollTop / max) * 100));
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [isActive]);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  }, []);

  useEffect(() => {
    if (!isActive) return;
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isActive, resetHideTimer]);

  // Keyboard controls
  useEffect(() => {
    if (!isActive) return;

    function onKey(e: KeyboardEvent) {
      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlayPause();
          break;
        case "ArrowUp":
          e.preventDefault();
          setSpeed((s) => Math.min(10, s + 1));
          resetHideTimer();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSpeed((s) => Math.max(1, s - 1));
          resetHideTimer();
          break;
        case "Escape":
          exitTeleprompter();
          break;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPlaying, resetHideTimer]);

  // Register service worker for offline capability
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Service worker registration failed silently
      });
    }
  }, []);

  function togglePlayPause() {
    setIsPlaying((prev) => {
      const next = !prev;
      if (!next) {
        setShowPaused(true);
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      } else {
        setShowPaused(false);
      }
      return next;
    });
    resetHideTimer();
  }

  function exitTeleprompter() {
    setIsActive(false);
    setIsPlaying(true);
    setProgress(0);
    setShowPaused(false);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }

  function handleStart() {
    if (!script.trim()) return;
    setIsActive(true);
    setIsPlaying(true);
    setProgress(0);
  }

  // Manual mode / loading
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <p className="font-body text-text-muted">Loading script...</p>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-4">
        <h1 className="font-heading text-3xl font-bold text-text-primary">
          Teleprompter
        </h1>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Paste your script here..."
          className="h-64 w-full max-w-xl resize-none rounded-lg border border-border bg-surface p-4 font-body text-base text-text-primary placeholder-text-muted outline-none focus:border-coral"
        />
        <button
          onClick={handleStart}
          disabled={!script.trim()}
          className="rounded-lg bg-coral px-8 py-3 font-heading text-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Start
        </button>
      </div>
    );
  }

  // Teleprompter view
  return (
    <div
      className="fixed inset-0 z-50 select-none"
      style={{ backgroundColor: "#000000" }}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      {/* Progress bar */}
      <div
        className="fixed left-0 right-0 top-0 z-[60]"
        style={{ height: 2, backgroundColor: "rgba(255,255,255,0.1)" }}
      >
        <div
          className="h-full transition-all duration-100"
          style={{
            width: `${progress}%`,
            backgroundColor: "#EB5E55",
          }}
        />
      </div>

      {/* Scrolling text area */}
      <div
        ref={containerRef}
        onClick={togglePlayPause}
        className="h-full overflow-y-auto px-6 pb-32 pt-12"
        style={{
          transform: mirrored ? "scaleX(-1)" : "none",
        }}
      >
        <p
          className="mx-auto max-w-2xl whitespace-pre-wrap leading-relaxed"
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: `${fontSize}px`,
            color: "#FFFFFF",
            lineHeight: 1.6,
          }}
        >
          {script}
        </p>
        {/* Extra space at bottom so text can scroll fully off screen */}
        <div className="h-[80vh]" />
      </div>

      {/* Paused overlay */}
      {showPaused && (
        <div className="pointer-events-none fixed inset-0 z-[65] flex items-center justify-center">
          <span
            className="rounded-xl px-8 py-4 font-heading text-2xl font-bold tracking-widest text-white"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          >
            PAUSED
          </span>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] transition-opacity duration-300"
        style={{
          opacity: controlsVisible ? 1 : 0,
          pointerEvents: controlsVisible ? "auto" : "none",
          background:
            "linear-gradient(transparent, rgba(0,0,0,0.85) 30%)",
        }}
      >
        <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 pb-8 pt-12">
          {/* Speed slider */}
          <div className="flex items-center gap-3">
            <span className="min-w-[60px] font-body text-sm text-white/60">
              Speed {speed}
            </span>
            <input
              type="range"
              min={1}
              max={10}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              className="teleprompter-slider h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 outline-none"
            />
          </div>

          {/* Button row */}
          <div className="flex items-center justify-center gap-3">
            {/* Font decrease */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFontSize((s) => Math.max(18, s - 2));
                resetHideTimer();
              }}
              className="rounded-full px-3 py-2 font-body text-sm font-semibold text-white"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              A-
            </button>

            {/* Font increase */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFontSize((s) => Math.min(60, s + 2));
                resetHideTimer();
              }}
              className="rounded-full px-3 py-2 font-body text-sm font-semibold text-white"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              A+
            </button>

            {/* Play / Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="rounded-full px-6 py-2 font-body text-sm font-semibold text-white"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              {isPlaying ? "Pause" : "Play"}
            </button>

            {/* Mirror toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMirrored((m) => !m);
                resetHideTimer();
              }}
              className="rounded-full px-3 py-2 font-body text-sm font-semibold text-white"
              style={{
                backgroundColor: mirrored
                  ? "rgba(235,94,85,0.4)"
                  : "rgba(255,255,255,0.15)",
              }}
            >
              Mirror
            </button>

            {/* Done */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                exitTeleprompter();
              }}
              className="rounded-full px-4 py-2 font-body text-sm font-semibold text-white"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Slider accent color */}
      <style jsx global>{`
        .teleprompter-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #eb5e55;
          cursor: pointer;
        }
        .teleprompter-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #eb5e55;
          cursor: pointer;
          border: none;
        }
        .teleprompter-slider::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 2px;
        }
        .teleprompter-slider::-moz-range-track {
          height: 4px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

export default function TeleprompterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-bg">
          <p className="font-body text-text-muted">Loading...</p>
        </div>
      }
    >
      <TeleprompterContent />
    </Suspense>
  );
}
