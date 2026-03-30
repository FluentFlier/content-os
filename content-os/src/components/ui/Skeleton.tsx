interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[#EDECEA] rounded ${className}`}
    />
  );
}

export function SkeletonLines({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === count - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}
