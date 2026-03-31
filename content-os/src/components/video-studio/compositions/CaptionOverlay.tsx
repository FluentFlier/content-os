import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Video } from 'remotion';

export interface CaptionWord {
  text: string;
  startFrame: number;
  endFrame: number;
}

export interface CaptionOverlayProps {
  videoSrc: string;
  captions: CaptionWord[];
  fontSize?: number;
  fontColor?: string;
  bgColor?: string;
  position?: 'bottom' | 'center' | 'top';
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  videoSrc,
  captions,
  fontSize = 42,
  fontColor = '#FFFFFF',
  bgColor = 'rgba(0,0,0,0.7)',
  position = 'bottom',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activeCaption = captions.find(
    (c) => frame >= c.startFrame && frame <= c.endFrame
  );

  const positionClass =
    position === 'top'
      ? { top: '10%' }
      : position === 'center'
      ? { top: '50%', transform: 'translateY(-50%)' }
      : { bottom: '12%' };

  const scale = activeCaption
    ? spring({ frame: frame - activeCaption.startFrame, fps, config: { damping: 15, stiffness: 200 } })
    : 0;

  return (
    <AbsoluteFill>
      <Video src={videoSrc} />
      {activeCaption && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: `translateX(-50%) scale(${scale})`,
            ...positionClass,
            padding: '8px 20px',
            borderRadius: 8,
            backgroundColor: bgColor,
            maxWidth: '80%',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontSize,
              fontWeight: 800,
              color: fontColor,
              fontFamily: 'Inter, system-ui, sans-serif',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            {activeCaption.text}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
