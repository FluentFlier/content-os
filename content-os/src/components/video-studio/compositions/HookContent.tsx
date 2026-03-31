import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence, Video } from 'remotion';

export interface HookContentProps {
  hookText: string;
  videoSrc: string;
  hookDurationFrames?: number;
  accentColor?: string;
}

export const HookContent: React.FC<HookContentProps> = ({
  hookText,
  videoSrc,
  hookDurationFrames = 90,
  accentColor = '#6366F1',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#09090B' }}>
      {/* Hook intro sequence */}
      <Sequence durationInFrames={hookDurationFrames}>
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10%',
          }}
        >
          {/* Accent line */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '10%',
              width: interpolate(frame, [0, 20], [0, 120], { extrapolateRight: 'clamp' }),
              height: 4,
              backgroundColor: accentColor,
              borderRadius: 2,
            }}
          />
          {/* Hook text */}
          <div
            style={{
              opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateRight: 'clamp' }),
              transform: `translateY(${interpolate(frame, [5, 20], [30, 0], { extrapolateRight: 'clamp' })}px)`,
            }}
          >
            <span
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: '#FAFAFA',
                fontFamily: 'Inter, system-ui, sans-serif',
                lineHeight: 1.2,
                textAlign: 'center',
                display: 'block',
              }}
            >
              {hookText}
            </span>
          </div>
          {/* Fade out at the end */}
          <AbsoluteFill
            style={{
              backgroundColor: '#09090B',
              opacity: interpolate(
                frame,
                [hookDurationFrames - 15, hookDurationFrames],
                [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              ),
            }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Video content */}
      <Sequence from={hookDurationFrames}>
        <AbsoluteFill>
          <Video src={videoSrc} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
