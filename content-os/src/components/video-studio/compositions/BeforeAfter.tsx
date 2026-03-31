import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Sequence, Video } from 'remotion';

interface BeforeAfterProps {
  beforeSrc: string;
  afterSrc: string;
  transitionFrame?: number;
  transitionDuration?: number;
  beforeLabel?: string;
  afterLabel?: string;
}

export const BeforeAfter: React.FC<BeforeAfterProps> = ({
  beforeSrc,
  afterSrc,
  transitionFrame = 90,
  transitionDuration = 30,
  beforeLabel = 'BEFORE',
  afterLabel = 'AFTER',
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const splitPosition = interpolate(
    frame,
    [transitionFrame, transitionFrame + transitionDuration],
    [100, 50],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const isTransitioning = frame >= transitionFrame;
  const isSplit = frame >= transitionFrame + transitionDuration;

  return (
    <AbsoluteFill style={{ backgroundColor: '#09090B' }}>
      {/* Before video (full or left half) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: `${splitPosition}%`,
          overflow: 'hidden',
        }}
      >
        <Video src={beforeSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {/* Before label */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '6px 14px',
            borderRadius: 6,
            opacity: isTransitioning ? 1 : 0,
          }}
        >
          <span style={{ color: '#EF4444', fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {beforeLabel}
          </span>
        </div>
      </div>

      {/* After video (right half) */}
      {isTransitioning && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: `${100 - splitPosition}%`,
            overflow: 'hidden',
          }}
        >
          <Video
            src={afterSrc}
            style={{
              width: `${(100 / (100 - splitPosition)) * 100}%`,
              height: '100%',
              objectFit: 'cover',
              marginLeft: `-${(splitPosition / (100 - splitPosition)) * 100}%`,
            }}
          />
          {/* After label */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: '6px 14px',
              borderRadius: 6,
            }}
          >
            <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'Inter, system-ui, sans-serif' }}>
              {afterLabel}
            </span>
          </div>
        </div>
      )}

      {/* Divider line */}
      {isTransitioning && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${splitPosition}%`,
            width: 3,
            backgroundColor: '#FAFAFA',
            transform: 'translateX(-50%)',
            boxShadow: '0 0 10px rgba(255,255,255,0.5)',
          }}
        />
      )}
    </AbsoluteFill>
  );
};
