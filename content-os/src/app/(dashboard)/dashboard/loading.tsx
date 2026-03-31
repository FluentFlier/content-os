import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Greeting skeleton */}
      <Skeleton className="h-7 w-64 mt-2" />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#09090B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] p-[13px_14px] space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-6 w-10" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Middle row: Up Next + Prompt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-[#09090B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] p-[13px_14px] space-y-3">
          <Skeleton className="h-3 w-16" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-[3px] h-8 rounded-r-[2px]" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
        <div className="bg-[#09090B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] p-[13px_14px] space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>

      {/* Backlog skeleton */}
      <div className="bg-[#09090B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] p-[13px_14px] space-y-3">
        <Skeleton className="h-3 w-16" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-[6px] h-[6px] rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-14" />
          </div>
        ))}
      </div>

      {/* Quick Actions skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[7px] p-[10px_14px]">
              <Skeleton className="w-[18px] h-[18px]" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
