'use client';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'default' | 'pill';
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, variant = 'default', className = '' }: TabsProps) {
  if (variant === 'pill') {
    return (
      <div className={`flex gap-1 overflow-x-auto scrollbar-hide ${className}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => onChange(tab.id)}
            className={`whitespace-nowrap px-4 py-[7px] min-h-[44px] text-[13px] font-body font-medium rounded-[20px] border-[0.5px] transition-all duration-100 shrink-0 ${
              activeTab === tab.id
                ? 'border-[#6366F1] text-[#6366F1] bg-[rgba(99,102,241,0.12)]'
                : 'border-[rgba(255,255,255,0.12)] text-[#A1A1AA] hover:text-[#FAFAFA] bg-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex gap-1 overflow-x-auto pb-[1px] scrollbar-hide border-b-[0.5px] border-[rgba(255,255,255,0.12)] ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-tab={tab.id}
          onClick={() => onChange(tab.id)}
          className={`whitespace-nowrap px-4 py-2 min-h-[44px] font-body font-medium text-[13px] border-b-[1.5px] transition-colors duration-100 shrink-0 ${
            activeTab === tab.id
              ? 'border-[#FAFAFA] text-[#FAFAFA]'
              : 'border-transparent text-[#A1A1AA] hover:text-[#FAFAFA]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export type { Tab, TabsProps };
