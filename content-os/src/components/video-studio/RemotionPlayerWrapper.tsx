'use client';

import React, { useMemo } from 'react';
import { Player } from '@remotion/player';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Video, Sequence } from 'remotion';
import type { CaptionWord } from './compositions';

interface WrapperProps {
  templateId: string;
  videoSrc: string;
  captions: CaptionWord[];
  hookText: string;
}

const DEMO_STATS = [
  { label: 'Views', value: '12.5K', startFrame: 10 },
  { label: 'Saves', value: '430', startFrame: 25 },
  { label: 'Shares', value: '89', startFrame: 40 },
];

// Single composition component that handles all templates
const UnifiedComposition: React.FC<Record<string, unknown>> = (props) => {
  const templateId = props.templateId as string;
  const videoSrc = props.videoSrc as string;
  const captions = props.captions as CaptionWord[];
  const hookText = props.hookText as string;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (templateId === 'talking-head-captions') {
    const active = captions.find((c) => frame >= c.startFrame && frame <= c.endFrame);
    const scale = active
      ? spring({ frame: frame - active.startFrame, fps, config: { damping: 15, stiffness: 200 } })
      : 0;
    return (
      <AbsoluteFill>
        <Video src={videoSrc} />
        {active && (
          <div style={{
            position: 'absolute', bottom: '12%', left: '50%',
            transform: `translateX(-50%) scale(${scale})`,
            padding: '8px 20px', borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.7)',
            maxWidth: '80%', textAlign: 'center',
          }}>
            <span style={{ fontSize: 42, fontWeight: 800, color: '#FFF', fontFamily: 'Inter, system-ui, sans-serif', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              {active.text}
            </span>
          </div>
        )}
      </AbsoluteFill>
    );
  }

  if (templateId === 'hook-content') {
    const hookDur = 90;
    return (
      <AbsoluteFill style={{ backgroundColor: '#09090B' }}>
        <Sequence durationInFrames={hookDur}>
          <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10%' }}>
            <div style={{
              position: 'absolute', top: '15%', left: '10%',
              width: interpolate(frame, [0, 20], [0, 120], { extrapolateRight: 'clamp' }),
              height: 4, backgroundColor: '#6366F1', borderRadius: 2,
            }} />
            <div style={{
              opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateRight: 'clamp' }),
              transform: `translateY(${interpolate(frame, [5, 20], [30, 0], { extrapolateRight: 'clamp' })}px)`,
            }}>
              <span style={{ fontSize: 52, fontWeight: 800, color: '#FAFAFA', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.2, textAlign: 'center', display: 'block' }}>
                {hookText}
              </span>
            </div>
            <AbsoluteFill style={{
              backgroundColor: '#09090B',
              opacity: interpolate(frame, [hookDur - 15, hookDur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            }} />
          </AbsoluteFill>
        </Sequence>
        <Sequence from={hookDur}>
          <AbsoluteFill><Video src={videoSrc} /></AbsoluteFill>
        </Sequence>
      </AbsoluteFill>
    );
  }

  if (templateId === 'stats-overlay') {
    return (
      <AbsoluteFill>
        <Video src={videoSrc} />
        <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '5%', right: '5%', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {DEMO_STATS.map((stat, i) => {
            const progress = spring({ frame: frame - stat.startFrame, fps, config: { damping: 12, stiffness: 180 } });
            const visible = frame >= stat.startFrame;
            return (
              <div key={i} style={{
                opacity: visible ? progress : 0, transform: `scale(${visible ? progress : 0})`,
                backgroundColor: 'rgba(9,9,11,0.85)', borderRadius: 12, padding: '16px 24px',
                textAlign: 'center', border: '1px solid rgba(99,102,241,0.25)', minWidth: 120,
              }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#6366F1', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 14, color: '#A1A1AA', marginTop: 4, fontFamily: 'Inter, system-ui, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    );
  }

  return <AbsoluteFill style={{ backgroundColor: '#09090B' }} />;
};

export default function RemotionPlayerWrapper({ templateId, videoSrc, captions, hookText }: WrapperProps) {
  return (
    <Player
      component={UnifiedComposition}
      inputProps={{ templateId, videoSrc, captions, hookText }}
      durationInFrames={300}
      fps={30}
      compositionWidth={1080}
      compositionHeight={1920}
      style={{ width: '100%' }}
      controls
    />
  );
}
