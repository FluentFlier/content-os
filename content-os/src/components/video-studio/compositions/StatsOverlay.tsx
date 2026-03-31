import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Video } from 'remotion';

interface StatItem {
  label: string;
  value: string;
  startFrame: number;
}

export interface StatsOverlayProps {
  videoSrc: string;
  stats: StatItem[];
  accentColor?: string;
}

export const StatsOverlay: React.FC<StatsOverlayProps> = ({
  videoSrc,
  stats,
  accentColor = '#6366F1',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Video src={videoSrc} />
      {/* Dark overlay for readability */}
      <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />
      {/* Stats cards */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          right: '5%',
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {stats.map((stat, i) => {
          const progress = spring({
            frame: frame - stat.startFrame,
            fps,
            config: { damping: 12, stiffness: 180 },
          });
          const visible = frame >= stat.startFrame;

          return (
            <div
              key={i}
              style={{
                opacity: visible ? progress : 0,
                transform: `scale(${visible ? progress : 0})`,
                backgroundColor: 'rgba(9,9,11,0.85)',
                borderRadius: 12,
                padding: '16px 24px',
                textAlign: 'center',
                border: `1px solid ${accentColor}40`,
                minWidth: 120,
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: accentColor,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: '#A1A1AA',
                  marginTop: 4,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
