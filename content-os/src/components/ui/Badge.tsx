interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-[3px] px-[7px] py-[2px] text-[10px] font-['Space_Grotesk'] font-medium tracking-[0.01em] leading-tight ${className}`}
    >
      {children}
    </span>
  );
}
