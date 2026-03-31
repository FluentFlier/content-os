export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Greeting skeleton */}
      <div className="h-7 w-64 mt-2 bg-[#27272A] rounded animate-pulse" />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#09090B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] p-[13px_14px] space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-[#27272A] rounded animate-pulse" />
              <div className="h-6 w-10 bg-[#27272A] rounded animate-pulse" />
            </div>
            <div className="h-3 w-20 bg-[#27272A] rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Middle row: Up Next + Prompt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-[#09090B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] p-[13px_14px] space-y-3">
          <div className="h-3 w-16 bg-[#27272A] rounded animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-[3px] h-8 bg-[#27272A] rounded-r-[2px] animate-pulse" />
              <div className="h-4 flex-1 bg-[#27272A] rounded animate-pulse" />
              <div className="h-5 w-16 bg-[#27272A] rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="bg-[#09090B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] p-[13px_14px] space-y-3">
          <div className="h-3 w-28 bg-[#27272A] rounded animate-pulse" />
          <div className="h-16 w-full bg-[#27272A] rounded animate-pulse" />
        </div>
      </div>

      {/* Backlog skeleton */}
      <div className="bg-[#09090B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] p-[13px_14px] space-y-3">
        <div className="h-3 w-16 bg-[#27272A] rounded animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-[6px] h-[6px] bg-[#27272A] rounded-full animate-pulse" />
            <div className="h-4 flex-1 bg-[#27272A] rounded animate-pulse" />
            <div className="h-5 w-14 bg-[#27272A] rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Quick Actions skeleton */}
      <div className="space-y-3">
        <div className="h-3 w-24 bg-[#27272A] rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[7px] p-[10px_14px]">
              <div className="w-[18px] h-[18px] bg-[#27272A] rounded animate-pulse" />
              <div className="h-3 w-16 bg-[#27272A] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
