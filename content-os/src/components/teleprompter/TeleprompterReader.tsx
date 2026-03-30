'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface TeleprompterReaderProps {
  script: string;
  onExit: () => void;
}

export default function TeleprompterReader({ script, onExit }: TeleprompterReaderProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(5);
  const [fontSize, setFontSize] = useState(32);
  const [mirrored, setMirrored] = useState(false);
  const [progress, setProgress] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showPaused, setShowPaused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollYRef = useRef(0);

  // Set initial font size based on script length
  useEffect(() => {
    const len = script.length;
    if (len < 500) setFontSize(38);
    else if (len < 1500) setFontSize(34);
    else if (len < 3000) setFontSize(30);
    else setFontSize(28);
  }, [script]);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [resetHideTimer]);

  // Auto-scroll via requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    function tick() {
      const el = containerRef.current;
      if (!el) return;

      const pxPerFrame = speed * 0.3;
      scrollYRef.current += pxPerFrame;
      el.scrollTop = scrollYRef.current;

      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speed]);

  // Track scroll progress
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onScroll() {
      if (!el) return;
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) { setProgress(100); return; }
      scrollYRef.current = el.scrollTop;
      setProgress(Math.min(100, (el.scrollTop / max) * 100));
    }

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Keyboard controls
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSpeed((s) => Math.min(10, s + 1));
          resetHideTimer();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSpeed((s) => Math.max(1, s - 1));
          resetHideTimer();
          break;
        case 'Escape':
          onExit();
          break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, resetHideTimer]);

  function togglePlayPause() {
    setIsPlaying((prev) => {
      const next = !prev;
      if (!next) setShowPaused(true);
      else setShowPaused(false);
      return next;
    });
    resetHideTimer();
  }

  return (
    <div
      className="fixed inset-0 z-50 select-none"
      style={{ backgroundColor: '#000000' }}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      {/* Progress bar */}
      <div className="fixed left-0 right-0 top-0 z-[60]" style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.1)' }}>
        <div
          className="h-full transition-all duration-100"
          style={{ width: `${progress}%`, backgroundColor: '#EB5E55' }}
        />
      </div>

      {/* Scrolling text area */}
      <div
        ref={containerRef}
        onClick={togglePlayPause}
        className="h-full overflow-y-auto px-20 pb-32 pt-16"
        style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}
      >
        <p
          className="font-display mx-auto max-w-[720px] whitespace-pre-wrap"
          style={{
            fontSize: `${fontSize}px`,
            color: '#FFFFFF',
            lineHeight: 1.7,
          }}
        >
          {script}
        </p>
        {/* Extra space at bottom so text can scroll fully */}
        <div className="h-[80vh]" />
      </div>

      {/* Paused overlay */}
      {showPaused && (
        <div className="pointer-events-none fixed inset-0 z-[65] flex items-center justify-center">
          <span
            className="font-display rounded-[12px] px-8 py-4 text-[22px] font-[800] tracking-widest text-white"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          >
            PAUSED
          </span>
        </div>
      )}

      {/* Controls bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] transition-opacity duration-300"
        style={{
          opacity: controlsVisible ? 1 : 0,
          pointerEvents: controlsVisible ? 'auto' : 'none',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.85) 30%)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 pb-8 pt-12">
          {/* Speed slider */}
          <div className="flex items-center gap-3">
            <span className="font-body min-w-[60px] text-[13px] text-white/60">
              Speed {speed}
            </span>
            <input
              type="range"
              min={1}
              max={10}
              value={speed}
              onChange={(e) => { setSpeed(Number(e.target.value)); resetHideTimer(); }}
              onClick={(e) => e.stopPropagation()}
              className="teleprompter-slider h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 outline-none"
            />
          </div>

          {/* Button row */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); setFontSize((s) => Math.max(28, s - 2)); resetHideTimer(); }}
              className="font-body rounded-full px-3 py-2 text-[13px] font-[600] text-white"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              A-
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setFontSize((s) => Math.min(42, s + 2)); resetHideTimer(); }}
              className="font-body rounded-full px-3 py-2 text-[13px] font-[600] text-white"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              A+
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setMirrored((m) => !m); resetHideTimer(); }}
              className="font-body rounded-full px-3 py-2 text-[13px] font-[600] text-white"
              style={{
                backgroundColor: mirrored ? 'rgba(235,94,85,0.4)' : 'rgba(255,255,255,0.15)',
              }}
            >
              Mirror
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
              className="font-body rounded-full px-6 py-2 text-[13px] font-[600] text-white"
              style={{
                backgroundColor: !isPlaying ? '#EB5E55' : 'rgba(255,255,255,0.15)',
              }}
            >
              {isPlaying ? 'Pause' : 'Resume'}
            </button>
            <Link
              href="/library"
              onClick={(e) => e.stopPropagation()}
              className="font-body rounded-full px-4 py-2 text-[13px] font-[600] text-white"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              Done
            </Link>
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
