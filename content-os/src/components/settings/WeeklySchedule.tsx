"use client";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface WeeklyScheduleProps {
  weeklySchedule: Record<string, string>;
  onScheduleChange: (schedule: Record<string, string>) => void;
  pillarOptions: string[];
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

export default function WeeklySchedule({
  weeklySchedule,
  onScheduleChange,
  pillarOptions,
  onSave,
  saving,
  saved,
}: WeeklyScheduleProps) {
  return (
    <>
      <div className="space-y-3 mb-4">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="flex items-center gap-4">
            <span className="text-sm text-[#FAFAFA] w-24">{day}</span>
            <select
              value={weeklySchedule[day] ?? "Rest"}
              onChange={(e) =>
                onScheduleChange({
                  ...weeklySchedule,
                  [day]: e.target.value,
                })
              }
              className="flex-1 bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-3 py-2 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#FAFAFA]/40 transition-colors"
            >
              <option value="Rest">Rest</option>
              {pillarOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <SaveButton onClick={onSave} loading={saving} saved={saved} />
    </>
  );
}

function SaveButton({
  onClick,
  loading,
  saved,
}: {
  onClick: () => void;
  loading: boolean;
  saved: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={loading}
        onClick={onClick}
        className="px-5 py-2 rounded-lg bg-[#6366F1] text-white font-medium text-sm hover:bg-[#6366F1]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Saving..." : "Save"}
      </button>
      {saved && (
        <span className="text-sm text-[#3B6D11] animate-fade-in">Saved!</span>
      )}
    </div>
  );
}
