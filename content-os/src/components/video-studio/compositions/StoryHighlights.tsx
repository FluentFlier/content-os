import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Sequence, Video } from 'remotion';

interface Clip {
  src: string;
  durationFrames: number;
  label?: string;
}

interface StoryHighlightsProps {
  clips: Clip[];
  transitionDuration?: number;
  accentColor?: string;
}

export const StoryHighlights: React.FC<StoryHighlightsProps> = ({
  clips,
  transitionDuration = 15,
  accentColor = '#6366F1',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let currentStart = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#09090B' }}>
      {clips.map((clip, i) => {
        const from = currentStart;
        currentStart += clip.durationFrames;

        const localFrame = frame - from;
        const fadeIn = interpolate(localFrame, [0, transitionDuration], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const fadeOut = interpolate(
          localFrame,
          [clip.durationFrames - transitionDuration, clip.durationFrames],
          [1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        return (
          <Sequence key={i} from={from} durationInFrames={clip.durationFrames}>
            <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
              <Video src={clip.src} />
              {/* Progress bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(localFrame / clip.durationFrames) * 100}%`,
                    backgroundColor: accentColor,
                  }}
                />
              </div>
              {/* Clip counter */}
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  backgroundColor: 'rgba(9,9,11,0.8)',
                  padding: '4px 10px',
                  borderRadius: 4,
                }}
              >
                <span style={{ color: '#A1A1AA', fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {i + 1}/{clips.length}
                </span>
              </div>
              {/* Label */}
              {clip.label && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(9,9,11,0.85)',
                    padding: '8px 20px',
                    borderRadius: 8,
                  }}
                >
                  <span style={{ color: '#FAFAFA', fontSize: 18, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {clip.label}
                  </span>
                </div>
              )}
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
